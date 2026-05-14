# `packages/*` — tóm tắt workspace cho AI (Graphify)

> **Sinh tự động:** `2026-05-14T06:11:08.152Z` — liệt kê package trong `packages/` (không nhúng source).

## Vai trò trong kiến trúc microservice

- Package **không** thay cho `@api`; app Next gọi API qua HTTP + `@workspace/api-client` hoặc `fetch` public.
- **Không import** source `apps/frontend`, `apps/backend`, `apps/api` từ package (kiểm soát bởi ESLint `sharedTsPackageBoundary`).

## Package (6)

| Package | Thư mục | Ghi chú |
|---------|----------|---------|
| `@thangph2146/lexical-editor` | `packages/editor/` | Editor Lexical workspace; tiêu thụ bởi Next apps + có thể tái xuất UI. |
| `@ui` | `packages/ui/` | Thư viện UI (React); không import `apps/*`. |
| `@workspace/api-client` | `packages/api-client/` | SDK HTTP tới `@api`; không import app Nest/Next. |
| `@workspace/eslint-config` | `packages/eslint-config/` | ESLint flat + `service-boundaries` (ranh giới import). |
| `@workspace/query-client` | `packages/query-client/` | `QueryClient` + retry/stale mặc định TanStack Query (dùng chung Next apps). |
| `@workspace/typescript-config` | `packages/typescript-config/` | tsconfig cơ sở cho package/app. |

## File Markdown trong `packages/.graphify/markdown/`

Artefact Graphify cho **workspace packages** nằm dưới `packages/.graphify/markdown/` (tách biệt `apps/*`).

- **`SUMMARY_FOR_AI.md`** — file này.
- **[`WORKSPACE_DEPS.md`](WORKSPACE_DEPS.md)** — cạnh `workspace:*` (xem mục dưới).
- **[`../README.md`](../README.md)** — giải thích scope thư mục Graphify packages.

## Phụ thuộc workspace (`workspace:*`)

- Bảng **from → dep** cho `packages/*` và `apps/*`: [`WORKSPACE_DEPS.md`](WORKSPACE_DEPS.md).

## Graphify — tóm tắt theo từng app (markdown)

Định vị **runtime** từng dịch vụ (không import chéo source giữa `apps/*`):

- [@frontend — SUMMARY](../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md)
- [@backend — SUMMARY](../../apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md)
- [@api — SUMMARY](../../apps/api/.graphify/markdown/SUMMARY_FOR_AI.md)
- [Chỉ mục monorepo](../../.graphify/markdown/SUMMARY_FOR_AI.md)

## Làm mới

- Khi thêm/xóa package: chạy lại `pnpm graphify:ai-summary` từ root (script quét lại `packages/`).
