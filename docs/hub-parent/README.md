# AI Docs Hub (hub-parent-template)

Thư mục này gom tài liệu Markdown để agent/AI đọc nhanh kiến trúc microservice và quy trình kiểm tra, thống nhất với mỏ neo [`apps/hub-parent/README.md`](../../apps/hub-parent/README.md).

## Tài liệu chính

- `MICROSERVICE_SYSTEM_MAP.md`: bản đồ kiến trúc + boundaries + checklist (API dùng **MikroORM**).
- `AGENTS_GUIDE.md`: hướng dẫn vận hành agent (đọc, kiểm tra, tự điều chỉnh).
- `FRONTEND_UX.md`: UX/UI storefront, nguồn palette (`apps/hub-parent/src/app/globals.css` ↔ `packages/ui`), a11y — **giữ nguyên** cách dùng `packages/*`.

## Graphify theo service

- `apps/frontend/.graphify/SUMMARY_FOR_AI.md`
- `apps/backend/.graphify/SUMMARY_FOR_AI.md`
- `apps/api/.graphify/SUMMARY_FOR_AI.md`

Ưu tiên đọc `SUMMARY_FOR_AI.md` trước, chỉ mở `context.json` khi cần trích đoạn cụ thể.
