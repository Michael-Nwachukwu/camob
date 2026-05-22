# syntax=docker/dockerfile:1

# ── deps ────────────────────────────────────────────────────────────────────
# Install node_modules once, cached on package*.json changes.
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ─────────────────────────────────────────────────────────────────
# Generates the Prisma client and builds the Next standalone output. This
# stage keeps the FULL node_modules (incl. the Prisma CLI + tsx), so the
# `migrate` and `seed` compose services reuse it to talk to the database.
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ── runner ──────────────────────────────────────────────────────────────────
# Minimal runtime: the standalone server + static assets + the Prisma engine.
FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone bundle (server.js + traced node_modules), static assets, public/.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Ensure the generated Prisma client + query engine are present at runtime.
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

USER node
EXPOSE 3000
CMD ["node", "server.js"]
