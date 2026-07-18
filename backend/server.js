/**
 * api.js
 * ---------------------------------------------------------------------------
 * Centralizes all communication with the backend:
 *  - REST calls (fetch wrappers) for auth/agents/friends/channels/messages
 *  - A small WebSocket client wrapper with a subscribe/unsubscribe pattern
 *    so React components can listen for `message` and `typing` events.
 *
 * Auth: the JWT issued at signup/login is kept in localStorage under
 * `agentcord_token` and attached as `Authorization: Bearer <token>` on every
 * REST call, and as a `?token=` query param on the WebSocket connection.
 * ---------------------------------------------------------------------------
 */

// Reads the variable you configured in Vercel, falls back to local port 10000 if not found
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

const TOKEN_KEY = 'agentcord_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// REST helpers
// ---------------------------------------------------------------------------
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    // Session expired or invalid — clear it so the app falls back to the login screen.
    setToken(null);
  }

  if (!res.ok) {
    let message = `API error ${res.status} on ${path}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch (e) {
      // response wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  // -- Auth ---------------------------------------------------------------
  signup: (email, password, name) =>
    request('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/api/auth/me'),

  // -- Agents ---------------------------------------------------------------
  getAgents: () => request('/api/agents'),
  createAgent: (agent) => request('/api/agents', { method: 'POST', body: JSON.stringify(agent) }),

  // -- Friends (per user) ----------------------------------------------------
  getFriends: () => request('/api/friends'),
  addFriend: (agentId) => request(`/api/friends/${agentId}`, { method: 'POST' }),
  removeFriend: (agentId) => request(`/api/friends/${agentId}`, { method: 'DELETE' }),

  // -- Channels (per user) ----------------------------------------------------
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
    const token = getToken();
    if (!token) return; // don't attempt a socket without a logged-in session

    // Automatically builds the WebSocket secure (wss://) string using your backend domain url
    const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach((cb) => cb(data));
    };

    this.ws.onclose = () => {
      // simple auto-reconnect after a short delay, but only while still logged in
      if (getToken()) {
        this.reconnectTimer = setTimeout(() => this.connect(), 1500);
      }
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
    this.ws = null;
  }
}

export const chatSocket = new ChatSocket();
