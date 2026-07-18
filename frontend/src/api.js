/**
 * api.js
 * ---------------------------------------------------------------------------
 * Centralizes all communication with the backend:
 *  - REST calls (fetch wrappers) for agents/friends/channels/messages
 *  - A small WebSocket client wrapper with a subscribe/unsubscribe pattern
 *    so React components can listen for `message` and `typing` events.
 * ---------------------------------------------------------------------------
 */

// Reads the variable you configured in Vercel, falls back to local port 10000 if not found
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

// Automatically builds the WebSocket secure (wss://) string using your backend domain url
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  getAgents: () => request('/api/agents'),
  getFriends: () => request('/api/friends'),
  addFriend: (agentId) => request(`/api/friends/${agentId}`, { method: 'POST' }),
  removeFriend: (agentId) => request(`/api/friends/${agentId}`, { method: 'DELETE' }),
  getChannels: () => request('/api/channels'),
  createChannel: (name, agentIds) =>
    request('/api/channels', { method: 'POST', body: JSON.stringify({ name, agentIds }) }),
  getMessages: (channelId) => request(`/api/channels/${channelId}/messages`),
};

// ---------------------------------------------------------------------------
// WebSocket client
// ---------------------------------------------------------------------------
class ChatSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
  }

  connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach((cb) => cb(data));
    };

    this.ws.onclose = () => {
      // simple auto-reconnect after a short delay
      this.reconnectTimer = setTimeout(() => this.connect(), 1500);
    };

    this.ws.onerror = () => {
      this.ws.close();
    };
  }

  /** Register a listener for incoming events. Returns an unsubscribe fn. */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /** Send a chat message from the user into a channel. */
  sendUserMessage(channelId, content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'user_message', channelId, content }));
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}

export const chatSocket = new ChatSocket();
