# ---------------------------------------------------------------------------
# Frontend image — multi-stage build.
# Stage 1 compiles the React app into static files.
# Stage 2 serves those static files with a lightweight nginx image.
# ---------------------------------------------------------------------------

# ---- Stage 1: build ----
FROM node:22-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

# These get baked into the JS bundle at build time — point them at your
# real backend URL when building for production (see docker-compose.yml
# and the "Hosting" section of the README for examples).
ARG REACT_APP_API_BASE=http://localhost:4000
ARG REACT_APP_WS_URL=ws://localhost:4000/ws
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
