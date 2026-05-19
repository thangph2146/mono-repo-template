# Phụ thuộc workspace (`workspace:*`)

> **Sinh tự động:** `2026-05-19T16:08:37.096Z` — quét `package.json` trong `packages/*` và `apps/*` (chỉ liên kết nội bộ monorepo).

## `packages/*`

| Package (from) | Phụ thuộc workspace | spec | Thư mục |
|------------------|---------------------|------|---------|
| `@lexical-editor` | `@workspace/eslint-config` | `workspace:*` | `packages/editor/` |
| `@lexical-editor` | `@workspace/typescript-config` | `workspace:*` | `packages/editor/` |
| `@ui` | `@workspace/eslint-config` | `workspace:*` | `packages/ui/` |
| `@ui` | `@workspace/typescript-config` | `workspace:*` | `packages/ui/` |
| `@workspace/api-client` | `@workspace/eslint-config` | `workspace:*` | `packages/api-client/` |
| `@workspace/api-client` | `@workspace/typescript-config` | `workspace:*` | `packages/api-client/` |
| `@workspace/query-client` | `@workspace/eslint-config` | `workspace:*` | `packages/query-client/` |
| `@workspace/query-client` | `@workspace/typescript-config` | `workspace:*` | `packages/query-client/` |

## `apps/*`

| App (from) | Phụ thuộc workspace | spec | Thư mục |
|------------|---------------------|------|---------|
| `@api` | `@workspace/eslint-config` | `workspace:*` | `apps/api/` |
| `@backend` | `@thangph2146/lexical-editor` | `workspace:*` | `apps/backend/` |
| `@backend` | `@ui` | `workspace:*` | `apps/backend/` |
| `@backend` | `@workspace/api-client` | `workspace:*` | `apps/backend/` |
| `@backend` | `@workspace/eslint-config` | `workspace:*` | `apps/backend/` |
| `@backend` | `@workspace/query-client` | `workspace:*` | `apps/backend/` |
| `@frontend` | `@thangph2146/lexical-editor` | `workspace:*` | `apps/frontend/` |
| `@frontend` | `@ui` | `workspace:*` | `apps/frontend/` |
| `@frontend` | `@workspace/api-client` | `workspace:*` | `apps/frontend/` |
| `@frontend` | `@workspace/eslint-config` | `workspace:*` | `apps/frontend/` |
| `@frontend` | `@workspace/query-client` | `workspace:*` | `apps/frontend/` |

## Làm mới

Chạy `pnpm graphify:ai-summary` từ root (script quét lại `package.json`).
