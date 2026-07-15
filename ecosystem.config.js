// ---------------------------------------------------------------------------
// PM2 process manager config — an alternative to Docker for running the
// backend on a plain VPS. PM2 keeps the process alive, restarts it if it
// crashes, and restarts it automatically on server reboot (with `pm2 startup`).
//
// Usage:
//   npm install -g pm2
//   cd backend && npm install --omit=dev
//   pm2 start ecosystem.config.js
//   pm2 save              # persist process list
//   pm2 startup           # generates a systemd command to run on boot
//
// The frontend does NOT need PM2 — it's just static files, served by nginx
// directly (see reverse-proxy/nginx.conf) after `npm run build`.
// ---------------------------------------------------------------------------
module.exports = {
  apps: [
    {
      name: "agentcord-backend",
      cwd: "./backend",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      instances: 1, // keep at 1 — in-memory WebSocket broadcast state isn't shared across instances
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
    },
  ],
};
