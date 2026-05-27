# Graphify — monorepo (hub-parent-template)

Thư mục `.graphify/` ở **root** giữ **chỉ mục monorepo** (`markdown/SUMMARY_FOR_AI.md`), checklist cho AI (`README.md`), và tùy chọn **snapshot** (`snapshot/`) khi chạy `node scripts/graphify-update.cjs`. Artefact Markdown chi tiết nằm trong **`apps/<app>/.graphify/markdown/`** và **`packages/.graphify/markdown/`** (JSON snapshot tương ứng trong `snapshot/` từng app).

## File Markdown tại `.graphify/` (root)

| File | Vai trò |
|------|---------|
| **`README.md`** | Hướng dẫn người + agent (file này; không sinh bởi script). |
| **`markdown/SUMMARY_FOR_AI.md`** | Chỉ mục monorepo + **mục "Chỉ dẫn theo chủ đề"** (bảng mục tiêu → đường dẫn); sinh bởi `pnpm graphify:ai-summary`. |

JSON snapshot repo-level (nếu dùng): **`.graphify/snapshot/`** — từ `node scripts/graphify-update.cjs .` ở root (tùy chọn; snapshot **đầy đủ theo service** nằm ở `apps/*/.graphify/snapshot/`).

## Ma trận artefact (clean scope)

| Phạm vi | Markdown (AI) | Snapshot JSON |
|----------|----------------|-----------------|
| **Root** `.graphify/` | `markdown/SUMMARY_FOR_AI.md` | `snapshot/` (nếu chạy `node scripts/graphify-update.cjs .`) |
| **`packages/`** | `packages/.graphify/markdown/*.md` | — |
| **Mỗi app** | `apps/<app>/.graphify/markdown/*.md` | `apps/<app>/.graphify/snapshot/` |

## Đọc theo thứ tự

1. **`markdown/SUMMARY_FOR_AI.md`** — bản đồ dịch vụ, ranh giới, link app/package, **bảng chỉ dẫn theo chủ đề**.
2. **`packages/.graphify/README.md`** + **`packages/.graphify/markdown/SUMMARY_FOR_AI.md`** + **`packages/.graphify/markdown/WORKSPACE_DEPS.md`** — workspace packages.
3. **`apps/<service>/.graphify/markdown/SUMMARY_FOR_AI.md`** (+ `FOLDER_TREE.md`, `GRAPH_STATS.md`; API thêm `API_DOMAIN_IMPORTS.md`) — từng service.

## Làm mới snapshot

```bash
# Single script for all apps:
node scripts/graphify-update.cjs apps/frontend
node scripts/graphify-update.cjs apps/backend
node scripts/graphify-update.cjs apps/api
pnpm graphify:ai-summary
```

`graph.json` / `context.json` (trong **`snapshot/`** mỗi app) / `GRAPH_REPORT.md` / `cache/` phục vụ visualization. **`pnpm graphify:ai-summary`** cập nhật `markdown/SUMMARY_FOR_AI.md` (root), artefact dưới `apps/*/.graphify/markdown/`, và `packages/.graphify/markdown/*.md` đã liệt kê.

## Checklist sau chuẩn hóa / refactor kiến trúc

Dùng cho người và agent: xác nhận code vẫn sạch và snapshot Graphify phản ánh đúng thay đổi.

1. **`pnpm check`** — bounds + lint + typecheck (bắt buộc trước khi coi task xong).
2. **Nếu đổi cấu trúc file/route/module:** chạy lại cả ba pipeline snapshot rồi tóm tắt AI:
   - `node scripts/graphify-update.cjs apps/frontend`
   - `node scripts/graphify-update.cjs apps/backend`
   - `node scripts/graphify-update.cjs apps/api`
   - `pnpm graphify:ai-summary`
3. **Đối chiếu nhanh (diff hoặc đọc lại file sinh):**
   - **`markdown/SUMMARY_FOR_AI.md` (root)** — mục *Chỉ dẫn theo chủ đề* + bảng app.
   - **`apps/<app>/.graphify/markdown/FOLDER_TREE.md`** / **`GRAPH_STATS.md`** — cây thư mục và điểm nóng import.
   - **`apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md`** (API) — domain, inbound, Mermaid.
   - **`packages/.graphify/markdown/WORKSPACE_DEPS.md`** — cạnh `workspace:*` mới/xóa có đúng không.
   - **`apps/<app>/.graphify/markdown/SUMMARY_FOR_AI.md`** — module map có khớp kỳ vọng không.
4. **Hoặc một lệnh:** `pnpm check:full` (gồm `pnpm check` + `graphify:ai-summary`) — **lưu ý:** không thay bước `update.cjs`; nếu chưa chạy `update.cjs` sau khi đổi cây thư mục, `snapshot/context.json` / `snapshot/graph.json` có thể cũ.

Khi chỉ sửa vài file nhỏ trong cây đã có, có thể chỉ chạy `update.cjs` cho **một** app bị ảnh hưởng rồi vẫn `pnpm graphify:ai-summary` từ root (script luôn quét lại cả monorepo).
