/**
 * db.js
 * ---------------------------------------------------------------------------
 * Handles all persistence for the app using SQLite (via better-sqlite3).
 *
 * Tables:
 *  - agents:        the catalogue of available AI agents ("bots")
 *  - friendships:   which agents the user has added as a "friend"
 *  - channels:      DM (1 agent) or group chats (many agents)
 *  - channel_members: which agents belong to which channel
 *  - messages:      chat history for every channel
 *
 * We use a single hardcoded "user" (id = 'user-1') since this is a
 * single-user demo app. Swapping to multi-user auth would mean adding a
 * `users` table and scoping friendships/channels/messages by user_id.
 * ---------------------------------------------------------------------------
 */

const { DatabaseSync } = require('node:sqlite'); // built into Node.js 22+, no native build step needed
const path = require('path');
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
    sender_id  TEXT NOT NULL,   -- 'user-1' or an agent id
    sender_name TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES channels(id)
  );
`);

// ---------------------------------------------------------------------------
// Seed default agents (only if table is empty)
// ---------------------------------------------------------------------------
const AGENT_SEED = require('./agentDefinitions');

const seedCount = db.prepare('SELECT COUNT(*) AS c FROM agents').get().c;
if (seedCount === 0) {
  const insert = db.prepare(`
    INSERT INTO agents (id, name, avatar_emoji, personality, color, style)
    VALUES (@id, @name, @avatar_emoji, @personality, @color, @style)
  `);
  const insertMany = db.transaction((agents) => {
    for (const a of agents) insert.run(a);
  });
  insertMany(AGENT_SEED);
  console.log(`Seeded ${AGENT_SEED.length} default agents.`);
}

// ---------------------------------------------------------------------------
// Query helpers (exported for use in server.js / agents.js)
// ---------------------------------------------------------------------------
module.exports = {
  db,
  uuid,

  getAllAgents() {
    return db.prepare('SELECT * FROM agents').all();
  },

  getAgent(id) {
    return db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  },

  // Inserts a user-created custom agent (from the "Create Agent" UI form)
  // and returns the persisted row.
  addCustomAgent({ name, avatar_emoji, personality, color, style }) {
    const id = `agent-custom-${uuid()}`;
    db.prepare(`
      INSERT INTO agents (id, name, avatar_emoji, personality, color, style)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, avatar_emoji, personality, color, style);
    return this.getAgent(id);
  },

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

  createChannel(name, isGroup, agentIds) {
    const id = uuid();
    db.prepare(`
      INSERT INTO channels (id, name, is_group, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, name, isGroup ? 1 : 0, new Date().toISOString());

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

  getAllChannels() {
    const channels = db.prepare('SELECT * FROM channels').all();
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
