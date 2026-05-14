# AGENTS Quick Guide (hub-parent-template)

Tài liệu này là **entry point ngắn gọn** cho agent. Chi tiết đầy đủ nằm trong `docs/hub-parent/`.

## Đọc trước khi sửa

1. `docs/hub-parent/README.md`
2. `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
3. `docs/hub-parent/AGENTS_GUIDE.md`
4. `docs/hub-parent/FRONTEND_UX.md` (khi chỉnh `apps/frontend`)
5. `.graphify/markdown/SUMMARY_FOR_AI.md` (chỉ mục monorepo + link tới từng app)
6. `packages/.graphify/markdown/SUMMARY_FOR_AI.md` (danh sách workspace packages)
7. `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`
8. `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`
9. `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`

Sau `.graphify/markdown/SUMMARY_FOR_AI.md`, dùng mục **Chỉ dẫn theo chủ đề** trong cùng file để chọn đúng `FOLDER_TREE.md` / `GRAPH_STATS.md` / `API_DOMAIN_IMPORTS.md` / `WORKSPACE_DEPS.md` (cùng thư mục `markdown/` của từng scope) theo việc cần làm.

Lưu ý: chỉ mở `apps/*/.graphify/snapshot/context.json` khi cần trích đoạn cụ thể (file lớn, nhúng full source). Sau refactor kiến trúc: chạy `update.cjs` cho app đổi cây file → `pnpm graphify:ai-summary`, rồi đối chiếu checklist trong `.graphify/README.md`. Skill Cursor (tùy chọn): `.cursor/skills/hub-graphify-standardize-loop/SKILL.md` — vòng chuẩn hóa → kiểm tra → làm mới graph → đọc lại markdown.

## Lệnh chuẩn bắt buộc

```bash
pnpm check
```

Nếu có thay đổi kiến trúc/module/routes: chạy `node apps/<app>/.graphify/update.cjs` cho từng app bị ảnh hưởng, rồi:

```bash
pnpm check:full
```

(`check:full` = `pnpm check` + `pnpm graphify:ai-summary`; không tự chạy `update.cjs` — xem checklist `.graphify/README.md`.)

## Nguyên tắc microservice

- Không import chéo source giữa các app trong `apps/*`.
- Frontend/Backend giao tiếp với API qua HTTP + `@workspace/api-client`.
- Logic dùng chung đặt ở `packages/*` khi thật sự còn được sử dụng.
- Ranh giới được kiểm soát bởi:
  - `packages/eslint-config/service-boundaries.js`
  - `scripts/verify-service-boundaries.mjs`
