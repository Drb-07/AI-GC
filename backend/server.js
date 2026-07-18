/**
 * server.js
 * ---------------------------------------------------------------------------
 * Entry point for the backend. Responsibilities:
 *
 *  1. REST API (Express) — CRUD for agents, friendships, and channels, plus
 *     fetching message history.
 *  2. WebSocket server (ws) — real-time message broadcast. When the user
 *     sends a message into a channel, we trigger a sequential 4-stage
 *     multi-agent pipeline:
 *       Stage 1: Orchestrator decomposes the prompt into sub-tasks.
 *       Stage 2: Generator (ChatGPT) drafts a solution.
 *       Stage 3: Researcher (Gemini) runs logical verification.
 *       Stage 4: Validator (Critic) resolves any conflicts and appends
 *                the Efficiency Card.
 *     Each stage is persisted + broadcast as its own message so judges can
 *     watch task decomposition, drafting, verification, and conflict
 *     resolution happen live, one after another.
 * ---------------------------------------------------------------------------
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const store = require('./db');
const { generateReply, generateAgentToAgentReply, runPipeline, runBenchmarkMetric } = require('./replyEngine');

const PORT = process.env.PORT || 4000;
const USER_ID = 'user-1';
const USER_NAME = 'You';

const app = express();

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

// Dynamically create a custom agent from the frontend "Create Agent" form.
app.post('/api/agents', (req, res) => {
  const { name, avatar_emoji, personality, color, style, engine } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  try {
    const agent = store.addCustomAgent({
      name: name.trim(),
      avatar_emoji: avatar_emoji || '🤖',
      personality: personality || 'A custom AI agent.',
      color: color || '#5865f2',
      style: style || 'supportive',
      engine: engine || 'gpt-4o',
    });
    res.status(201).json(agent);
  } catch (err) {
    console.error('Failed to create custom agent:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
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

// -- Benchmarking & Efficiency Metrics ------------------------------------
app.post('/api/benchmark', (req, res) => {
  const { content } = req.body;
  const agents = store.getAllAgents();

  if (!content) {
    return res.status(400).json({ error: 'Prompt content is required for testing' });
  }

  const report = runBenchmarkMetric(content, agents);
  res.json(report);
});

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendStageMessage(channel, agent, content) {
  await delay(400 + Math.random() * 400);
  broadcast({ type: 'typing', channelId: channel.id, agentId: agent.id, agentName: agent.name });
  await delay(500 + Math.random() * 500);

  const saved = store.addMessage(channel.id, agent.id, agent.name, content);
  broadcast({ type: 'message', channelId: channel.id, message: saved });
  return saved;
}

/**
 * Orchestrates the 4-stage pipeline: Orchestrator -> Generator -> Researcher
 * -> Validator. Each stage is persisted and broadcast the moment it
 * completes, so the frontend renders them one at a time in order.
 */
async function runAgentResponses(channel, triggerContent) {
  const agents = channel.members;
  if (!agents || agents.length === 0) return;

  let pipeline;
  try {
    pipeline = await runPipeline(triggerContent, agents);
  } catch (err) {
    console.error('[Pipeline] failed unexpectedly:', err);
    return;
  }

  // Stage 1: Orchestrator — task decomposition
  await sendStageMessage(channel, pipeline.orchestrator.agent, pipeline.orchestrator.content);

  // Stage 2: Generator — draft solution
  await sendStageMessage(channel, pipeline.generator.agent, pipeline.generator.content);

  // Stage 3: Researcher — logical verification
  await sendStageMessage(channel, pipeline.researcher.agent, pipeline.researcher.content);

  // Stage 4: Validator — conflict resolution + Efficiency Card
  await sendStageMessage(channel, pipeline.validator.agent, pipeline.validator.content);

  // Optional extra banter round for group chats with more than the 4 core
  // agents (e.g. a custom agent the user added as a "friend").
  const extraAgents = agents.filter(
    (a) => !['orchestrator', 'generator', 'researcher', 'validator'].includes(a.style)
  );
  if (channel.is_group && extraAgents.length > 0 && Math.random() < 0.6) {
    const responder = extraAgents[Math.floor(Math.random() * extraAgents.length)];
    await delay(700 + Math.random() * 700);
    broadcast({ type: 'typing', channelId: channel.id, agentId: responder.id, agentName: responder.name });
    await delay(500 + Math.random() * 500);

    const replyText = generateAgentToAgentReply(responder, pipeline.validator.agent.name, pipeline.validator.content);
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

      const saved = store.addMessage(channelId, USER_ID, USER_NAME, content);
      broadcast({ type: 'message', channelId, message: saved });

      runAgentResponses(channel, content).catch((err) =>
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
