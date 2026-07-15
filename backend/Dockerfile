# ---------------------------------------------------------------------------
# Backend image — Node.js + Express + WebSocket server
# Requires Node 22.5+ for the built-in node:sqlite module.
# ---------------------------------------------------------------------------
FROM node:22-slim

WORKDIR /app

# Install dependencies first (better layer caching — only reinstalls if
# package.json/package-lock.json change, not on every code edit)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the backend source
COPY . .

# Persist the SQLite DB outside the image layer so it survives rebuilds
# when this directory is mounted as a volume (see docker-compose.yml)
VOLUME ["/app/data"]

ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]
