# Step 1: System Overview

Tổng quan nhanh để hiểu cấu trúc monorepo và các ranh giới trước khi phát triển.

## Dịch vụ chính
- `apps/api` — NestJS + MikroORM: entities, migrations, seeders, controllers, services.
- `apps/frontend` — Storefront Next.js (public-facing).
- `apps/backend` — Admin Next.js (internal admin).

## Packages chia sẻ
- `packages/api-client` — SDK gọi `apps/api` (HTTP).
- `packages/query-client` — cấu hình TanStack Query dùng chung.
- `packages/ui`, `packages/editor` — UI / editor components.
- `packages/eslint-config`, `packages/typescript-config` — quy tắc lint/tsconfig chung.

## Nguyên tắc ranh giới
- KHÔNG import chéo source giữa `apps/*`.
- Next apps gọi `apps/api` qua HTTP hoặc `@workspace/api-client`.
- Logic DB (entities, migrations, seeders) chỉ ở `apps/api`.
- Logic dùng chung đặt ở `packages/*` nếu thực sự cần chia sẻ.

## Tài liệu quan trọng (đọc trước khi sửa code)
- `docs/hub-parent/PRE_CODE_PROTOCOL.md` — quy trình bắt buộc trước khi sửa code.
- `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` — sơ đồ microservice và checklist.
- `docs/hub-parent/AGENTS_GUIDE.md` — hướng dẫn đọc thứ tự và chạy `pnpm check`.
- `.graphify/markdown/SUMMARY_FOR_AI.md` và `apps/*/.graphify/markdown/SUMMARY_FOR_AI.md` — bản tóm tắt graph cho từng app.
- Nếu task liên quan page/feature: `docs/pages/<feature>-implementation.md`.

## Quy trình thay đổi (tối thiểu)
1. Xác định phạm vi (app/package/feature).
2. Đọc các tài liệu trong mục "Tài liệu quan trọng" theo thứ tự.
3. Mở `apps/<app>/.graphify/markdown/FOLDER_TREE.md` để định vị file mục tiêu.
4. Chỉnh code chỉ sau khi hiểu luồng dữ liệu.
5. Chạy từ root:

```bash
pnpm check
```

6. Nếu thay đổi kiến trúc/module/routes lớn:

```bash
# cập nhật snapshot cho app
node apps/<app>/.graphify/update.cjs
pnpm graphify:ai-summary
pnpm check:full
```

## Kiểm tra hoàn thành
- `pnpm check` phải pass.
- Không vi phạm `service-boundaries` (xem `packages/eslint-config/service-boundaries.js`).
- Không thêm phụ thuộc sai vào `package.json` của app/package.

----
File này là tóm tắt; tham khảo chi tiết trong `docs/hub-parent` và `.graphify/markdown/`.
