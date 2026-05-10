# syntax=docker/dockerfile:1.7
# Multi-stage build for the @api NestJS microservice.

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=9.15.9

# ─────────────────────────────────────────────────────────────────────────────
# 1. Base image with pnpm enabled.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

# ─────────────────────────────────────────────────────────────────────────────
# 2. Prune monorepo to only the @api service and its workspace deps.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.9 prune @api --docker

# ─────────────────────────────────────────────────────────────────────────────
# 3. Install dependencies and build the pruned workspace.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /repo/out/full/ ./
RUN pnpm turbo run build --filter=@api...

# ─────────────────────────────────────────────────────────────────────────────
# 4. Production runtime — only ship compiled JS + production deps.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3002
ENV SERVICE_NAME=@api

WORKDIR /app
COPY --from=builder /repo/apps/api/package.json ./package.json
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --prod --frozen-lockfile --ignore-workspace

EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --spider http://localhost:3002/api/health || exit 1

CMD ["node", "dist/main.js"]
