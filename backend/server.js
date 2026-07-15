/**
 * server.js
 * ---------------------------------------------------------------------------
 * Entry point for the backend. Responsibilities:
 *
 *  1. REST API (Express) — CRUD for agents, friendships, and channels, plus
 *     fetching message history.
 *  2. WebSocket server (ws) — real-time message broadcast. When the user
 *     sends a message into a channel, we:
 *       a. Persist + broadcast it immediately.
 *       b. Trigger every agent in that channel to "think" (simulated delay)
 *          and respond, persisting + broadcasting each response.
 *       c. In group chats, agents occasionally reply to each other too,
 *          creating multi-agent banter (capped to avoid infinite loops).
 *
 * Run with: npm start (see package.json)
 * ---------------------------------------------------------------------------
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const store = require('./db');
const { generateReply, generateAgentToAgentReply } = require('./replyEngine');

const PORT = process.env.PORT || 4000;
const USER_ID = 'user-1';
const USER_NAME = 'You';

const app = express();

// In production, set CORS_ORIGIN to your frontend's real URL (e.g.
// https://app.your-domain.com) instead of leaving it wide open.
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

// -- Agents -------------------------------------------------------------
app.get('/api/agents', (req, res) => {
  res.json(store.getAllAgents());
});

// -- Friendships ----------------------------------------------------------
app.get('/api/friends', (req, res) => {
  res.json(store.getFriends(USER_ID));
});

app.post('/api/friends/:agentId', (req, res) => {
  const agent = store.getAgent(req.params.agentId);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  store.addFriend(USER_ID, agent.id);
  res.json({ ok: true });
});

app.delete('/api/friends/:agentId', (req, res) => {
  store.removeFriend(USER_ID, req.params.agentId);
  res.json({ ok: true });
});

// -- Channels (DMs + group chats) -----------------------------------------
app.get('/api/channels', (req, res) => {
  res.json(store.getAllChannels());
});

app.post('/api/channels', (req, res) => {
  const { name, agentIds } = req.body;
  if (!Array.isArray(agentIds) || agentIds.length === 0) {
    return res.status(400).json({ error: 'agentIds required' });
  }
  const isGroup = agentIds.length > 1;
  const channelName = name || (isGroup ? 'Group Chat' : store.getAgent(agentIds[0])?.name || 'Chat');
  const channel = store.createChannel(channelName, isGroup, agentIds);
  res.json(channel);
});

app.get('/api/channels/:id/messages', (req, res) => {
  const channel = store.getChannel(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });
  res.json(store.getMessages(req.params.id));
});

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

/** Broadcast a message payload to all connected clients. */
function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

/** Small helper to simulate "typing" latency before an agent responds. */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs the agent response pipeline for a channel after a triggering message.
 * - Every agent in the channel replies to the user's message.
 * - In group channels, there's a chance for agents to riff off each other
 *   for a couple of extra rounds (capped) to feel like a real group chat.
 */
async function runAgentResponses(channel, triggerSenderName, triggerContent) {
  const agents = channel.members;
  let lastSpeakerName = triggerSenderName;
  let lastContent = triggerContent;

  for (const agent of agents) {
    // typing delay so it feels real-time rather than instant
    await delay(600 + Math.random() * 900);

    broadcast({ type: 'typing', channelId: channel.id, agentId: agent.id, agentName: agent.name });
    await delay(400 + Math.random() * 600);

    const replyText =
      lastSpeakerName === USER_NAME
        ? generateReply(agent, lastContent)
        : generateAgentToAgentReply(agent, lastSpeakerName, lastContent);

    const saved = store.addMessage(channel.id, agent.id, agent.name, replyText);
    broadcast({ type: 'message', channelId: channel.id, message: saved });

    lastSpeakerName = agent.name;
    lastContent = replyText;
  }

  // Extra banter round for group chats (agents responding to the last agent)
  if (channel.is_group && agents.length > 1 && Math.random() < 0.6) {
    const responder = agents[Math.floor(Math.random() * agents.length)];
    await delay(800 + Math.random() * 800);
    broadcast({ type: 'typing', channelId: channel.id, agentId: responder.id, agentName: responder.name });
    await delay(500 + Math.random() * 500);

    const replyText = generateAgentToAgentReply(responder, lastSpeakerName, lastContent);
    const saved = store.addMessage(channel.id, responder.id, responder.name, replyText);
    broadcast({ type: 'message', channelId: channel.id, message: saved });
  }
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }

    if (data.type === 'user_message') {
      const { channelId, content } = data;
      const channel = store.getChannel(channelId);
      if (!channel) return;

      // 1. Persist + broadcast the user's message immediately
      const saved = store.addMessage(channelId, USER_ID, USER_NAME, content);
      broadcast({ type: 'message', channelId, message: saved });

      // 2. Kick off agent response pipeline (fire and forget)
      runAgentResponses(channel, USER_NAME, content).catch((err) =>
        console.error('Error generating agent responses:', err)
      );
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

server.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`✅ WebSocket endpoint at ws://localhost:${PORT}/ws`);
});
