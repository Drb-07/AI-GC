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
// FIX 1: Added evaluateOutput to the imports at the top
const { generateReply, generateAgentToAgentReply, decomposeTask, evaluateOutput } = require('./replyEngine');

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
 * - Decomposes the user task first into an organized structural blueprint.
 * - Every assigned agent processes its given piece sequentially.
 * - Resolves execution conflicts if an agent's output fails criteria thresholds.
 * - Runs an extra banter round at the end for group chats.
 */
async function runAgentResponses(channel, triggerSenderName, triggerContent) {
  const agents = channel.members;
  if (!agents || agents.length === 0) return;

  // 1. Task Decomposition Phase
  await delay(500);
  const plan = decomposeTask(triggerContent, agents);
  
  let planSummary = "📋 **Task Collaboration Blueprint Generated:**\n";
  plan.forEach((step, index) => {
    planSummary += `${index + 1}. [${step.assignedAgent.name}] ➔ ${step.subTask}\n`;
  });

  const blueprintMsg = store.addMessage(channel.id, 'orchestrator', 'System Orchestrator', planSummary);
  broadcast({ type: 'message', channelId: channel.id, message: blueprintMsg });

  let lastSpeakerName = triggerSenderName;
  let lastContent = triggerContent;

  // Select a designated reviewer agent for conflicts (preferring sarcastic or technical styles)
  const reviewerAgent = agents.find(a => a.style === 'sarcastic' || a.style === 'technical') || agents[0];

  // 2. Targeted Execution & Conflict Resolution Phase
  for (const step of plan) {
    const currentAgent = step.assignedAgent;

    await delay(800 + Math.random() * 600);
    broadcast({ type: 'typing', channelId: channel.id, agentId: currentAgent.id, agentName: currentAgent.name });
    await delay(600 + Math.random() * 400);

    const executionContext = `[Executing Role: ${step.subTask}] Previous context: ${lastContent}`;
    let replyText = lastSpeakerName === USER_NAME
        ? generateReply(currentAgent, executionContext)
        : generateAgentToAgentReply(currentAgent, lastSpeakerName, executionContext);

    // --- Disagreement & Conflict Resolution Logic ---
    const review = evaluateOutput(replyText, reviewerAgent);
    
    if (review.executionConflict) {
      // Step A: Broadcast the Reviewer's Disagreement
      await delay(600);
      const conflictMsg = store.addMessage(
        channel.id, 
        reviewerAgent.id, 
        reviewerAgent.name, 
        `⚠️ **Disagreement Raised:** "${review.critique}"`
      );
      broadcast({ type: 'message', channelId: channel.id, message: conflictMsg });

      // Step B: The original worker agent processes the critique and attempts a fix
      await delay(1000);
      broadcast({ type: 'typing', channelId: channel.id, agentId: currentAgent.id, agentName: currentAgent.name });
      await delay(600);
      
      replyText = `[Resolved Output] Correcting layout specs. Baseline verified. System requirements met. Context optimized.`;
    }
    // -----------------------------------------------------

    const saved = store.addMessage(channel.id, currentAgent.id, currentAgent.name, `🛠️ **Sub-task Output:** ${replyText}`);
    broadcast({ type: 'message', channelId: channel.id, message: saved });

    lastSpeakerName = currentAgent.name;
    lastContent = replyText;
  }

  // 3. Extra banter round for group chats
  if (channel.is_group && agents.length > 1 && Math.random() < 0.6) {
    const responder = agents[Math.floor(Math.random() * agents.length)];
    await delay(800 + Math.random() * 800);
    broadcast({ type: 'typing', channelId: channel.id, agentId: responder.id, agentName: responder.name });
    await delay(500 + Math.random() * 500);

    const replyText = generateAgentToAgentReply(responder, lastSpeakerName, lastContent);
    const saved = store.addMessage(channel.id, responder.id, responder.name, replyText);
    broadcast({ type: 'message', channelId: channel.id, message: saved });
  }
} // FIX 2: Correctly closed the function here and removed duplicate stray code blocks.

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
