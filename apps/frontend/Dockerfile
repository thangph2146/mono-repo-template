# syntax=docker/dockerfile:1.7
# Multi-stage build for the @frontend Next.js storefront.

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=9.15.9

FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.9.9 prune @frontend --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /repo/out/full/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm turbo run build --filter=@frontend...

FROM node:${NODE_VERSION} AS runner
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app
COPY --from=builder /repo/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=builder /repo/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /repo/apps/frontend/public ./apps/frontend/public
COPY --from=builder /repo/apps/frontend/next.config.ts ./apps/frontend/next.config.ts
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /repo/turbo.json ./turbo.json

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000 || exit 1

WORKDIR /app/apps/frontend
CMD ["pnpm", "start", "--port", "3000"]
