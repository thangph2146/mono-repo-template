# AI Docs Hub (hub-parent-template)

Thư mục này gom tài liệu Markdown tham chiếu chuyên sâu cho agent/AI khi cần hiểu kiến trúc và quy trình.

## Vai trò của folder này
- `docs/steps/` tại root là lộ trình chính cho agent.
- `docs/hub-parent/` là bộ tài liệu tham khảo chi tiết về microservice, agent protocol, UX storefront và Graphify.
- `docs/pages/` là bộ guide implementation theo feature.

## Tài liệu chính trong `hub-parent`
- `PRE_CODE_PROTOCOL.md`: quy trình bắt buộc trước khi agent sửa code, gồm thứ tự đọc docs, mapping `docs/pages/`, boundary checklist.
- `MICROSERVICE_SYSTEM_MAP.md`: bản đồ kiến trúc + boundaries + checklist (API dùng **MikroORM**).
- `AGENTS_GUIDE.md`: hướng dẫn agent vận hành (đọc, kiểm tra, tự điều chỉnh).
- `FRONTEND_UX.md`: UX/UI storefront, nguồn palette (`apps/hub-parent/src/app/globals.css` ↔ `packages/ui`), a11y — **giữ nguyên** cách dùng `packages/*`.

## Lộ trình đề xuất
1. Đọc `docs/steps/step1_system_overview.md`.
2. Nếu cần biết chi tiết quy trình agent: đọc `docs/steps/step3_hub_parent_docs.md`.
3. Khi task liên quan feature backend: đọc `docs/pages/<feature>-implementation.md`.
4. Khi cần check import boundaries hoặc architecture: đọc `MICROSERVICE_SYSTEM_MAP.md`.

## Graphify theo service
- `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`
- `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`
- `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`

Ưu tiên đọc `markdown/SUMMARY_FOR_AI.md` trước, chỉ mở `snapshot/context.json` khi cần trích đoạn cụ thể.
