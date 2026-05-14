---
name: hub-graphify-standardize-loop
description: Runs the hub-parent-template architecture standardization loop—pnpm check, Graphify snapshot refresh via update.cjs per app, pnpm graphify:ai-summary, then review generated markdown including the topic guide embedded in .graphify/markdown/SUMMARY_FOR_AI.md, per-app markdown/FOLDER_TREE.md and GRAPH_STATS.md, API markdown/API_DOMAIN_IMPORTS.md (with Mermaid), packages markdown/WORKSPACE_DEPS.md and packages .graphify README, app markdown/SUMMARY_FOR_AI.md files, and the checklist in .graphify/README.md. Use when refactoring or standardizing apps/frontend, apps/backend, or apps/api; when updating routes or module layout; or when the user mentions Graphify, snapshot/context.json refresh, post-refactor verification, or pnpm check:full in this monorepo.
disable-model-invocation: false
---

# Vòng chuẩn hóa Hub — Graphify + kiểm tra (monorepo)

Skill này cố định **quy trình đã ghi trong repo** (không chỉ trong chat). Đọc nguồn chính:

- `.graphify/README.md` — mục **Checklist sau chuẩn hóa / refactor kiến trúc**
- `.graphify/markdown/SUMMARY_FOR_AI.md` — chỉ mục monorepo + mục **Chỉ dẫn theo chủ đề** (bảng mục tiêu → file)
- `AGENTS.md` — lệnh `pnpm check` / `pnpm check:full` và lưu ý `update.cjs`
- `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` — ranh giới + Graphify

## Khi nào áp dụng

- Bắt đầu hoặc **kết thúc** một đợt chuẩn hóa / refactor kiến trúc (đổi thư mục, module Nest, route Next, package workspace).
- Sau khi gộp/tách feature, đổi import giữa domain API, hoặc thêm app/package vào graph.

## Quy trình (theo thứ tự)

1. **Đọc checklist repo** — mở `.graphify/README.md` (phần checklist); không bỏ qua bước `update.cjs` nếu cây file đã đổi.
2. **Kiểm tra tĩnh** — từ root: `pnpm check` (bounds + lint + typecheck). Chỉ coi xong khi pass.
3. **Làm mới snapshot Graphify** (khi đổi cấu trúc / route / module map):
   ```bash
   node apps/frontend/.graphify/update.cjs
   node apps/backend/.graphify/update.cjs
   node apps/api/.graphify/update.cjs
   # Tùy chọn: graph snapshot cấp repo (thường ít node) — `apps/*/.graphify/snapshot/` mới là nguồn chính cho từng service
   # node .graphify/update.cjs
   pnpm graphify:ai-summary
   ```
   Nếu chỉ một app đổi cây file, có thể chỉ chạy `update.cjs` cho app đó, vẫn chạy `pnpm graphify:ai-summary` từ root. Artefact Markdown luôn nằm dưới **`<scope>/.graphify/markdown/`**; JSON dưới **`snapshot/`** (clean scope).
4. **Đọc lại artefact markdown** (đối chiếu kỳ vọng, diff git nếu cần):
   - **`.graphify/markdown/SUMMARY_FOR_AI.md`** — mục *Chỉ dẫn theo chủ đề* + bảng dịch vụ.
   - **`apps/<app>/.graphify/markdown/FOLDER_TREE.md`** và **`GRAPH_STATS.md`** (mọi app có graph).
   - **`apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md`** — bảng domain, inbound, Mermaid.
   - **`packages/.graphify/markdown/WORKSPACE_DEPS.md`**, **`packages/.graphify/README.md`** — `workspace:*` + scope packages.
   - **`markdown/SUMMARY_FOR_AI.md`** từng app (`apps/*/.graphify/markdown/`) và **`packages/.graphify/markdown/SUMMARY_FOR_AI.md`**.
5. **Tùy chọn một lệnh gộp** — `pnpm check:full` chạy `pnpm check` + `pnpm graphify:ai-summary`; **không** thay thế bước 3 nếu chưa chạy `update.cjs` sau thay đổi cây file.

## Nguyên tắc microservice (nhắc ngắn)

- Không import chéo source giữa `apps/*`.
- Next ↔ API qua HTTP; SDK workspace `@workspace/api-client` (và có thể `fetch` public tùy luồng storefront).

## Không làm

- Không coi `pnpm graphify:ai-summary` là đủ nếu chưa có `snapshot/graph.json`/`snapshot/context.json` mới sau khi đổi cây thư mục.
- Không dùng chỉ chat làm nguồn sự thật — luôn đối chiếu file trong repo như trên.
