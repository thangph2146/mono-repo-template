# Hub parent template — bản đồ monorepo cho AI (Graphify)

> **Sinh tự động:** `2026-05-14T03:45:43.595Z` — chỉ mục dẫn đường; chi tiết module nằm ở từng app/package bên dưới.

## Chỉ dẫn theo chủ đề (đọc trước khi mở sâu)

Bảng dưới giúp agent mở **đúng file Graphify** trước khi đào `snapshot/context.json` (file nặng).

| Mục tiêu | Mở đầu tiên | Tiếp theo |
|------------|-------------|-----------|
| Bản đồ monorepo | **File này** (`SUMMARY_FOR_AI.md`) | [`../../packages/.graphify/markdown/SUMMARY_FOR_AI.md`](../../packages/.graphify/markdown/SUMMARY_FOR_AI.md), [`../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`](../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) |
| Ranh giới service / check | [`../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`](../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md) | [`../../AGENTS.md`](../../AGENTS.md), `pnpm verify:bounds` |
| Cây `src/` một app | [`../../apps/frontend/.graphify/markdown/FOLDER_TREE.md`](../../apps/frontend/.graphify/markdown/FOLDER_TREE.md) (đổi `frontend` → `backend` / `api`) | `SUMMARY_FOR_AI.md` cùng app |
| Quy mô graph, điểm nóng import | [`../../apps/frontend/.graphify/markdown/GRAPH_STATS.md`](../../apps/frontend/.graphify/markdown/GRAPH_STATS.md) (đổi segment app) | `FOLDER_TREE.md`, `snapshot/context.json` (khi cần) |
| Domain Nest import lẫn nhau | [`../../apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md`](../../apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md) | `GRAPH_STATS.md`, bảng controller trong `SUMMARY` |
| Phụ thuộc `workspace:*` | [`../../packages/.graphify/markdown/WORKSPACE_DEPS.md`](../../packages/.graphify/markdown/WORKSPACE_DEPS.md) | [`../../packages/.graphify/README.md`](../../packages/.graphify/README.md), `SUMMARY_FOR_AI.md` packages |
| UX storefront (Next công khai) | [`../../docs/hub-parent/FRONTEND_UX.md`](../../docs/hub-parent/FRONTEND_UX.md) | [`../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`](../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) |
| Quy trình agent (đọc thứ tự) | [`../../docs/hub-parent/AGENTS_GUIDE.md`](../../docs/hub-parent/AGENTS_GUIDE.md) | [`../../AGENTS.md`](../../AGENTS.md) |
| Kiểm tra ranh giới tự động | [`../../scripts/verify-service-boundaries.mjs`](../../scripts/verify-service-boundaries.mjs) | `pnpm verify:bounds`, ESLint `service-boundaries` |
| Vòng chuẩn hóa → check → graph | [`../README.md`](../README.md) (checklist) | [`../../.cursor/skills/hub-graphify-standardize-loop/SKILL.md`](../../.cursor/skills/hub-graphify-standardize-loop/SKILL.md) |

## Dịch vụ (`apps/*`)

| App | Vai trò | Graphify |
|-----|---------|----------|
| `@frontend` | Storefront Next (HUB công khai) | `apps/frontend/.graphify/` (`markdown/`, `snapshot/`) |
| `@backend` | Admin Next (vận hành) | `apps/backend/.graphify/` (`markdown/`, `snapshot/`) |
| `@api` | NestJS + MikroORM, REST/WebSocket | `apps/api/.graphify/` (`markdown/`, `snapshot/`) |

## Ranh giới (microservice)

- **Không** import chéo source giữa `apps/frontend`, `apps/backend`, `apps/api`.
- Next ↔ API: **HTTP**; SDK chính `@workspace/api-client` (`createStoreSyncSdk`). Public storefront có thể dùng thêm `fetch` trong `lib/public-posts.ts` (envelope JSON).
- Kiểm tra: `pnpm verify:bounds` + ESLint `packages/eslint-config/service-boundaries.js`.

## Ma trận artefact (clean scope)

| Phạm vi | Markdown (AI, `pnpm graphify:ai-summary`) | Snapshot JSON (`node …/update.cjs`) |
|----------|---------------------------------------------|----------------------------------------|
| **Root** `.graphify/` | `.graphify/markdown/SUMMARY_FOR_AI.md` | `.graphify/snapshot/` (tùy chọn, `node .graphify/update.cjs`) |
| **`packages/`** | `packages/.graphify/markdown/*.md` | — |
| **Mỗi app** `apps/<x>/` | `apps/<x>/.graphify/markdown/*.md` | `apps/<x>/.graphify/snapshot/context.json` + `graph.json` |

## Góc tìm nhanh (nhiệm vụ → đọc gì)

| Nhiệm vụ | Mở trước |
|----------|----------|
| Đổi route / page / layout Next | `apps/<app>/.graphify/markdown/SUMMARY` + `FOLDER_TREE` |
| Đổi module Nest / import domain | `apps/api/.../SUMMARY` + `API_DOMAIN_IMPORTS` + `GRAPH_STATS` |
| Thêm/sửa package workspace | `packages/.../SUMMARY` + `WORKSPACE_DEPS` + `verify:bounds` |
| Chuẩn hóa sau refactor | `.graphify/README.md` (checklist) + skill `hub-graphify-standardize-loop` |

## `packages/*` (chia sẻ workspace)

- Bản tóm riêng: **`packages/.graphify/markdown/SUMMARY_FOR_AI.md`** (cùng script root).

## Trạng thái snapshot Graphify (`snapshot/context.json`)

| App | Files trong context | generatedAt (context) | SUMMARY |
|-----|--------------------|------------------------|---------|
| `frontend` | 77 | 2026-05-14T02:12:06.397Z | [`apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`](apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) |
| `backend` | 44 | 2026-05-14T02:12:10.661Z | [`apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`](apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md) |
| `api` | 125 | 2026-05-14T02:12:15.288Z | [`apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`](apps/api/.graphify/markdown/SUMMARY_FOR_AI.md) |

## Artefact từ `snapshot/graph.json` / package scan (`pnpm graphify:ai-summary`)

- Mỗi app: **`apps/<app>/.graphify/markdown/FOLDER_TREE.md`**, **`GRAPH_STATS.md`** — cây `src/` + thống kê graph / điểm nóng import.
- **`apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md`** — domain `src/<tên>/`, inbound, sơ đồ Mermaid (cạnh `imports`).
- **`packages/.graphify/README.md`** — mô tả layout Graphify packages (`markdown/`).
- **`packages/.graphify/markdown/WORKSPACE_DEPS.md`** — cạnh `workspace:*` giữa package và app.

## Quy trình làm mới toàn bộ đồ thị

```bash
# Từng app (cập nhật snapshot/context.json + snapshot/graph.json)
node apps/frontend/.graphify/update.cjs
node apps/backend/.graphify/update.cjs
node apps/api/.graphify/update.cjs
# (Tùy) snapshot graph cấp monorepo — ít node nếu không scan deep
# node .graphify/update.cjs
# Root: SUMMARY cho AI (mọi app + packages + chỉ mục monorepo)
pnpm graphify:ai-summary
```

## Đọc thêm

- `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
- `docs/hub-parent/AGENTS_GUIDE.md`
- `docs/hub-parent/FRONTEND_UX.md` (storefront / UI)
- `AGENTS.md` (entry agent)
