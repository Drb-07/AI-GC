# AgentCord 🤖

A Discord-like chat app — except your "friends" are AI agents, not people. Add
agents as friends, DM them 1:1, or create multi-agent group chats where the
agents talk to each other *and* to you in real time.

<p align="center">
  <img src="https://img.shields.io/badge/backend-Node.js%20%2B%20Express%20%2B%20WebSocket-3a86ff" />
  <img src="https://img.shields.io/badge/frontend-React-5865f2" />
  <img src="https://img.shields.io/badge/database-SQLite-f0a500" />
</p>

---

## ✨ Features

- **Friends list** of predefined AI agents (Nova, Sage, Byte, Echo, Mochi), each with its own personality and a rule-based "AI" reply engine.
- **1:1 DMs** — adding a friend auto-creates a private channel with that agent.
- **Group chats** — pick 2+ agent friends and drop them all in a group channel. Agents will respond to you *and* occasionally banter with each other, just like a real group chat.
- **Real-time messaging** over WebSocket, including live "agent is typing…" indicators.
- **Persistent storage** in SQLite (agents, friendships, channels, messages) — restart the server and your chat history is still there.
- Clean separation of concerns: REST API for CRUD, WebSocket for real-time events, a swappable rule-based reply engine that could be replaced with a real LLM call later.

---

## 🏗️ Architecture

```
discord-ai-agents/
├── backend/
│   ├── server.js            # Express REST API + WebSocket server (entry point)
│   ├── db.js                 # SQLite schema, seed data, and query helpers
│   ├── agentDefinitions.js   # Static roster of AI agents (name, personality, style)
│   ├── replyEngine.js        # Rule-based "simulated AI" response generator
│   └── data/app.db           # SQLite database file (created on first run)
│
└── frontend/
    ├── src/
    │   ├── App.jsx                    # Root component — owns all app state
    │   ├── api.js                     # REST client + WebSocket client wrapper
    │   ├── components/
    │   │   ├── Sidebar.jsx            # Channel list + nav actions
    │   │   ├── ChatWindow.jsx         # Message list, typing indicator, input box
    │   │   ├── Message.jsx            # Single message bubble
    │   │   ├── AddFriendModal.jsx     # Browse/add/remove agent friends
    │   │   └── NewGroupModal.jsx      # Create a multi-agent group chat
    │   └── styles.css                 # Discord-inspired dark theme
    └── public/index.html
```

### How real-time messaging works

1. The React client opens a single WebSocket connection (`ws://localhost:4000/ws`) on load.
2. When the user sends a message, the client emits `{ type: 'user_message', channelId, content }`.
3. The server persists the message to SQLite and **broadcasts** it to all connected clients (`{ type: 'message', ... }`).
4. The server then loops through every agent in that channel:
   - Broadcasts a `{ type: 'typing', agentId, agentName }` event.
   - Waits a randomized short delay (to simulate "thinking").
   - Generates a reply via the rule-based `replyEngine.js`, persists it, and broadcasts it as a `message` event.
5. In **group chats**, there's a chance for an additional agent to riff off the last agent's reply, creating natural-feeling multi-agent banter (capped to avoid infinite loops).

### The "AI" — rule-based reply engine

Each agent has a `style` (e.g. `enthusiastic`, `philosophical`, `technical`,
`sarcastic`, `supportive`). `replyEngine.js` first checks the incoming message
against a small set of keyword rules per style (e.g. greetings, sadness,
questions) and falls back to a pool of generic in-character responses if
nothing matches. This keeps the whole project **dependency-free and runnable
with zero API keys**.

> Want to plug in a real LLM later? Swap out `generateReply()` in
> `replyEngine.js` for a call to your model provider of choice (OpenAI,
> Anthropic, etc.) — the rest of the app (WebSocket plumbing, persistence,
> UI) doesn't need to change.

### Database schema

| Table | Purpose |
|---|---|
| `agents` | The catalogue of available AI agents |
| `friendships` | Which agents the (single, hardcoded) user has added as a friend |
| `channels` | DMs (1 agent) or group chats (2+ agents) |
| `channel_members` | Which agents belong to which channel |
| `messages` | Full chat history per channel |

The backend uses Node's **built-in `node:sqlite` module** (available in
Node.js 22.5+), so there's no native compilation step required — just
`npm install` and go.

---

## 🚀 Setup & running locally

### Requirements
- Node.js **v22.5.0 or later** (for built-in `node:sqlite` support)

### 1. Backend

```bash
cd backend
npm install
npm start
```

The server starts on **http://localhost:4000** and exposes:
- REST API under `/api/*`
- WebSocket endpoint at `ws://localhost:4000/ws`

On first run it auto-creates `backend/data/app.db` and seeds 5 default agents.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start
```

This starts the React dev server on **http://localhost:3000**, which talks to
the backend at `http://localhost:4000` by default. To point it somewhere
else, copy `.env.example` to `.env` and adjust `REACT_APP_API_BASE` /
`REACT_APP_WS_URL`.

### 3. Use it

1. Open http://localhost:3000
2. Click **"➕ Add Agent Friend"** and add a couple of agents — each one auto-creates a DM.
3. Click **"👥 New Group Chat"**, pick 2+ friended agents, and give the group a name.
4. Send a message — watch the agents "type" and reply, and (in groups) sometimes reply to each other.

---

## 🔧 REST API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents` | List all available agents |
| `GET` | `/api/friends` | List the user's agent friends |
| `POST` | `/api/friends/:agentId` | Add an agent as a friend |
| `DELETE` | `/api/friends/:agentId` | Remove an agent friend |
| `GET` | `/api/channels` | List all channels (DMs + group chats) with members |
| `POST` | `/api/channels` | Create a channel — body: `{ name, agentIds: [...] }` |
| `GET` | `/api/channels/:id/messages` | Get message history for a channel |

### WebSocket events

**Client → Server**
```json
{ "type": "user_message", "channelId": "...", "content": "hey!" }
```

**Server → Client**
```json
{ "type": "message", "channelId": "...", "message": { "id", "sender_id", "sender_name", "content", "created_at" } }
{ "type": "typing", "channelId": "...", "agentId": "...", "agentName": "..." }
```

---

## 🌐 Hosting / Deployment

This repo includes three ways to deploy, from easiest to most hands-on.

### Option A — PaaS (easiest, no server management)

Good platforms for this stack: **Render**, **Railway**, **Fly.io**.

1. **Backend**: create a new "Web Service" pointing at the `backend/` folder.
   - Build command: `npm install`
   - Start command: `npm start`
   - Make sure the platform's Node runtime is **22.5+** (for `node:sqlite`).
   - ⚠️ Most PaaS free/hobby tiers use **ephemeral disks** — the SQLite file
     will be wiped on redeploy. Attach a persistent volume/disk if the
     platform offers one (Render and Fly.io both do), mounted at
     `backend/data`. Otherwise treat this as demo/dev data only.
   - Note the public URL it gives you, e.g. `https://agentcord-api.onrender.com`.
2. **Frontend**: create a "Static Site" pointing at `frontend/`.
   - Build command: `npm install && npm run build`
   - Publish directory: `build`
   - Set env vars before building: `REACT_APP_API_BASE=https://agentcord-api.onrender.com` and `REACT_APP_WS_URL=wss://agentcord-api.onrender.com/ws` (note **`wss://`**, not `ws://`, since the backend will be served over HTTPS).
3. Back on the backend service, set `CORS_ORIGIN` to your frontend's URL (e.g. `https://agentcord.onrender.com`) so the browser doesn't block requests.

### Option B — Docker (recommended for a VPS)

The repo ships with `docker-compose.yml`, `backend/Dockerfile`, and `frontend/Dockerfile`.

```bash
# On any machine with Docker + Docker Compose installed:
git clone <your-repo-url>
cd discord-ai-agents

# Edit docker-compose.yml first: set REACT_APP_API_BASE / REACT_APP_WS_URL
# to your real domain/IP (see comments in the file), then:
docker compose up -d --build
```

This runs the backend on port `4000` and the frontend (served by nginx) on
port `8080`. The SQLite database persists in a named Docker volume
(`backend-data`) across restarts and rebuilds.

For a real domain with HTTPS, put the `reverse-proxy/nginx.conf` config (or
your provider's load balancer) in front of both containers — see the next
option for the exact nginx + certbot steps.

### Option C — Plain VPS (Ubuntu/Debian, full control)

1. **Provision a server** (DigitalOcean, Linode, AWS EC2, Hetzner, etc.) and point a domain's DNS `A` record at its IP.
2. **Install Node.js 22+**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs nginx certbot python3-certbot-nginx
   sudo npm install -g pm2
   ```
3. **Clone the repo and build both halves:**
   ```bash
   git clone <your-repo-url> && cd discord-ai-agents

   cd backend && npm install --omit=dev && cd ..

   cd frontend
   npm install
   REACT_APP_API_BASE=https://your-domain.com/api \
   REACT_APP_WS_URL=wss://your-domain.com/ws \
   npm run build
   cd ..
   ```
4. **Run the backend under PM2** (auto-restarts on crash/reboot):
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup   # follow the printed command to enable on-boot startup
   ```
5. **Serve the frontend build + proxy the API/WS through nginx.** Copy
   `reverse-proxy/nginx.conf` to `/etc/nginx/sites-available/agentcord`,
   update `server_name` to your domain, and point its `location /` block at
   `frontend/build` instead of a proxy_pass, e.g.:
   ```nginx
   location / {
       root /path/to/discord-ai-agents/frontend/build;
       try_files $uri /index.html;
   }
   ```
   (The version in the repo assumes you're running the frontend as its own
   nginx container per Option B — adjust as shown above if serving it
   directly from this same nginx instance instead.)
   ```bash
   sudo ln -s /etc/nginx/sites-available/agentcord /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d your-domain.com   # sets up HTTPS + auto-renewal
   ```
6. Visit `https://your-domain.com` — the frontend loads and talks to the API/WebSocket over the same domain (no CORS issues since everything's same-origin).

### Things to double-check on any host

- **HTTPS/WSS matters**: browsers block a plain `ws://` connection from an `https://` page. Once your frontend is on HTTPS, the backend's WebSocket must be reachable as `wss://` (this is what the nginx `Upgrade`/`Connection` headers in `reverse-proxy/nginx.conf` handle).
- **`CORS_ORIGIN`**: set this backend env var to your real frontend URL in production instead of leaving it as `*`.
- **Persistent storage**: the SQLite file at `backend/data/app.db` needs to live on a persistent disk/volume, or every redeploy wipes your chat history and friend list.
- **Single instance only**: don't horizontally scale the backend to multiple instances behind a load balancer — WebSocket broadcast state is in-memory and per-process, so a message sent to instance A wouldn't reach a client connected to instance B. If you need to scale, you'd add a shared pub/sub layer (e.g. Redis) first.

---

## 🧩 Extending this project

- **Add a new agent**: add an entry to `backend/agentDefinitions.js` (name, emoji, color, personality, and a `style` key), then add matching rules in `backend/replyEngine.js`.
- **Swap in a real LLM**: replace the body of `generateReply()` in `replyEngine.js` with an API call, passing in the agent's `personality` as a system prompt.
- **Multi-user support**: add a `users` table, real auth, and scope `friendships`/`channels`/`messages` by `user_id` instead of the hardcoded `user-1`.

---

## 📝 License

MIT — do whatever you'd like with this.
