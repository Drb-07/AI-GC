/**
 * db.js
 * ---------------------------------------------------------------------------
 * Handles all persistence for the app using SQLite (via node:sqlite).
 *
 * Tables:
 *  - users:         registered accounts (email + salted/hashed password)
 *  - agents:        the catalogue of available AI agents ("bots") — shared
 *                    across all users, not per-user data
 *  - friendships:   which agents a given user has added as a "friend"
 *  - channels:      DM (1 agent) or group chats (many agents) — scoped to
 *                    the user who created them via `user_id`
 *  - channel_members: which agents belong to which channel
 *  - messages:      chat history for every channel
 *
 * Every user's friendships, channels, and messages are isolated by
 * `user_id` so separate accounts never see each other's chat data. The
 * agent catalogue itself (the bots available to add as friends) remains
 * shared/global across accounts.
 * ---------------------------------------------------------------------------
 */

const { DatabaseSync } = require('node:sqlite'); // built into Node.js 22+, no native build step needed
const path = require('path');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const rawDb = new DatabaseSync(DB_PATH);

// Thin wrapper so the rest of this file can keep using the familiar
// better-sqlite3-style `.prepare(sql).run/get/all(...)` API.
const db = {
  exec(sql) {
    rawDb.exec(sql);
  },
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      run: (...args) => stmt.run(...args),
      get: (...args) => stmt.get(...args),
      all: (...args) => stmt.all(...args),
    };
  },
  transaction(fn) {
    return (arg) => {
      rawDb.exec('BEGIN');
      try {
        fn(arg);
        rawDb.exec('COMMIT');
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  },
};

db.exec('PRAGMA foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,   -- format: "<salt_hex>:<hash_hex>"
    name          TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    avatar_emoji TEXT NOT NULL,
    personality TEXT NOT NULL,   -- short description shown in UI
    color       TEXT NOT NULL,   -- hex color for avatar bg
    style       TEXT NOT NULL    -- key used by the rule-based reply engine
  );

  CREATE TABLE IF NOT EXISTS friendships (
    user_id  TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, agent_id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS channels (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,   -- owner of this channel; keeps chats isolated per account
    name       TEXT NOT NULL,
    is_group   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channel_members (
    channel_id TEXT NOT NULL,
    agent_id   TEXT NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    PRIMARY KEY (channel_id, agent_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    sender_id  TEXT NOT NULL,   -- a user id or an agent id
    sender_name TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id)
  );
`);

// Migration: add `engine` column if this DB predates it (safe no-op if it
// already exists — SQLite throws on duplicate ADD COLUMN, so we swallow it).
try {
  db.exec("ALTER TABLE agents ADD COLUMN engine TEXT DEFAULT 'gpt-4o'");
} catch (err) {
  // column already exists — fine
}

// Migration: add `user_id` to channels if this DB predates multi-user auth.
// Any pre-existing channels get assigned to a placeholder owner so old rows
// don't become orphaned/inaccessible; they simply won't show up for any
// real account (which is the correct behavior for pre-auth demo data).
try {
  db.exec("ALTER TABLE channels ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy-no-owner'");
} catch (err) {
  // column already exists — fine
}

// ---------------------------------------------------------------------------
// Seed default agents (only if table is empty)
// ---------------------------------------------------------------------------
const AGENT_SEED = require('./agentDefinitions');

const seedCount = db.prepare('SELECT COUNT(*) AS c FROM agents').get().c;
if (seedCount === 0) {
  const insert = db.prepare(`
    INSERT INTO agents (id, name, avatar_emoji, personality, color, style, engine)
    VALUES (@id, @name, @avatar_emoji, @personality, @color, @style, @engine)
  `);
  const insertMany = db.transaction((agents) => {
    for (const a of agents) insert.run(a);
  });
  insertMany(AGENT_SEED);
  console.log(`Seeded ${AGENT_SEED.length} default agents.`);
}

// ---------------------------------------------------------------------------
// Password hashing helpers (no external dependency — uses Node's built-in
// crypto.scrypt, which needs no native build step, unlike bcrypt).
// ---------------------------------------------------------------------------
function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plainPassword, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidateHash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidateHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Query helpers (exported for use in server.js)
// ---------------------------------------------------------------------------
module.exports = {
  db,
  uuid,

  // -- Users / auth ---------------------------------------------------------
  createUser({ email, password, name }) {
    const id = `user-${uuid()}`;
    const password_hash = hashPassword(password);
    const created_at = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase().trim(), password_hash, name, created_at);
    return this.getUserById(id);
  },

  getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  },

  getUserById(id) {
    const row = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(id);
    return row || null;
  },

  verifyUserPassword(email, password) {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (!verifyPassword(password, user.password_hash)) return null;
    return this.getUserById(user.id);
  },

  // -- Agents -----------------------------------------------------------
  getAllAgents() {
    return db.prepare('SELECT * FROM agents').all();
  },

  getAgent(id) {
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  },

  // Inserts a user-created custom agent (from the "Create Agent" UI form)
  // and returns the persisted row.
  addCustomAgent({ name, avatar_emoji, personality, color, style, engine }) {
    const id = `agent-custom-${uuid()}`;
    db.prepare(`
      INSERT INTO agents (id, name, avatar_emoji, personality, color, style, engine)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, avatar_emoji, personality, color, style, engine || 'gpt-4o');
    return this.getAgent(id);
  },

  // -- Friendships (scoped per user_id) --------------------------------------
  getFriends(userId) {
    return db.prepare(`
      SELECT a.* FROM agents a
      JOIN friendships f ON f.agent_id = a.id
      WHERE f.user_id = ?
    `).all(userId);
  },

  addFriend(userId, agentId) {
    db.prepare(`
      INSERT OR IGNORE INTO friendships (user_id, agent_id, created_at)
      VALUES (?, ?, ?)
    `).run(userId, agentId, new Date().toISOString());
  },

  removeFriend(userId, agentId) {
    db.prepare('DELETE FROM friendships WHERE user_id = ? AND agent_id = ?')
      .run(userId, agentId);
  },

  // -- Channels (scoped per user_id) ----------------------------------------
  createChannel(userId, name, isGroup, agentIds) {
    const id = uuid();
    db.prepare(`
      INSERT INTO channels (id, user_id, name, is_group, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, name, isGroup ? 1 : 0, new Date().toISOString());

    const insertMember = db.prepare(`
      INSERT INTO channel_members (channel_id, agent_id) VALUES (?, ?)
    `);
    const insertMany = db.transaction((ids) => {
      for (const agentId of ids) insertMember.run(id, agentId);
    });
    insertMany(agentIds);

    return this.getChannel(id);
  },

  getChannel(id) {
    const channel = db.prepare('SELECT * FROM channels WHERE id = ?').get(id);
    if (!channel) return null;
    const members = db.prepare(`
      SELECT a.* FROM agents a
      JOIN channel_members cm ON cm.agent_id = a.id
      WHERE cm.channel_id = ?
    `).all(id);
    return { ...channel, members };
  },

  // Only returns channels owned by this user — this is what keeps one
  // account's group chats/DMs invisible to every other account.
  getAllChannels(userId) {
    const channels = db.prepare('SELECT * FROM channels WHERE user_id = ?').all(userId);
    return channels.map((c) => this.getChannel(c.id));
  },

  addMessage(channelId, senderId, senderName, content) {
    const id = uuid();
    const created_at = new Date().toISOString();
    db.prepare(`
      INSERT INTO messages (id, channel_id, sender_id, sender_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, channelId, senderId, senderName, content, created_at);
    return { id, channel_id: channelId, sender_id: senderId, sender_name: senderName, content, created_at };
  },

  getMessages(channelId, limit = 200) {
    return db.prepare(`
      SELECT * FROM messages WHERE channel_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `).all(channelId, limit);
  },
};
