# Anchored Summary — hub-parent-template

## Active Progress

### 1. Upload API Restructure (DONE)
**Goal:** Move file serving from `/api/admin/uploads/serve/*` (auth-gated) to `/api/uploads/*` (public).

**Changes made:**
- **`uploads.controller.ts`** — Added `getServeBaseUrl()` returning `/api/uploads`; removed `X-User-Id` requirement from POST endpoint
- **`uploads.service.ts`** — Updated all 3 stale `/api/admin/uploads/serve` fallback references to `/api/uploads/`
- **`floating-link-editor-plugin.tsx`** — Removed old `/api/admin/uploads/serve` path; now uses `/api/uploads` directly

**Verified:** `pnpm check` green (lint + typecheck pass).

**User issue:** Upload not working. **Action:** Restart API server (`pnpm dev` in `apps/api`).

### 2. `.env` Configuration (DONE)
- `STORAGE_DIR="D:/HUB/data"` without quotes in `.env`
- Removed `PASSPHRASE` (unused)
- `DEFAULT_API_URL=http://localhost:3002` set in both `.env` (for local) and `.envrc` (for shell)

### 3. API Routes — Final Map
```
POST  /api/admin/uploads          (no auth required)
GET   /api/uploads/images/*path   (public, serve images)
GET   /api/uploads/files/*path    (public, serve files)
```
Old route `/api/admin/uploads/serve/*path` is DEPRECATED.

## Repo Structure
- Monorepo with `apps/api`, `apps/backend`, `apps/frontend`
- Shared packages: `@workspace/api-client`, `@workspace/ui`, `@workspace/query-client`, `@workspace/eslint-config`, `@workspace/typescript-config`
- Editor: `@thangph2146/lexical-editor` at `packages/editor`
- Microservice boundaries enforced by `scripts/verify-service-boundaries.mjs`
- Graphify docs: `apps/*/.graphify/markdown/SUMMARY_FOR_AI.md` (index + folder tree + API domains)

## Known Patterns
- API uses `createSuccessResponse()` / `createErrorResponse()` helpers
- Uploads stored under `STORAGE_DIR/uploads/{images,files}/YYYY/MM/DD/`
- Service boundaries: no cross-imports between `apps/*`; HTTP communication via `@workspace/api-client`
