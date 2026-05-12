# Microservice System Map (hub-parent-template)

Tài liệu này là bản đồ nhanh để AI/agent hiểu đúng kiến trúc microservice trong monorepo trước khi đọc code, chạy kiểm tra, và tự điều chỉnh.

## 1) Service Boundaries

- `@api` (`apps/api`): NestJS + **MikroORM** (entity, migrations, seeders; cấu hình runtime `src/config/database.config.ts`, CLI `mikro-orm.config.ts`, script `orm` / `db:*` trong `apps/api/package.json`).
- `@frontend` (`apps/frontend`): Storefront Next.js cho người dùng cuối.
- `@backend` (`apps/backend`): Admin Next.js cho vận hành nội bộ.

Nguyên tắc:

- Không import chéo source giữa các app trong `apps/*`.
- Frontend/Backend gọi API qua HTTP và `@workspace/api-client`.
- Logic chia sẻ không phụ thuộc runtime app đặt ở `packages/*` (vd `@workspace/promo-codes`).

## 2) Shared Packages

- `@workspace/api-client`: SDK/contract để gọi `@api`.
- `@workspace/promo-codes`: business rules dùng chung.
- `@ui`: component/UI primitives dùng cho Next apps.
- `@workspace/eslint-config`: lint rules + service boundaries.

## 3) Thứ Tự Đọc Khuyến Nghị Cho AI

1. `apps/frontend/.graphify/SUMMARY_FOR_AI.md`
2. `apps/backend/.graphify/SUMMARY_FOR_AI.md`
3. `apps/api/.graphify/SUMMARY_FOR_AI.md`
4. `packages/eslint-config/service-boundaries.js`
5. `scripts/verify-service-boundaries.mjs`
6. File source cụ thể liên quan task

Lưu ý:

- Tránh đọc toàn bộ `apps/*/.graphify/context.json` nếu chưa cần, vì file lớn và nhúng full source.
- Dùng `SUMMARY_FOR_AI.md` để định vị module trước, sau đó mở đúng file mục tiêu.

## 4) Quy Trình Kiểm Tra Chuẩn

Chạy ở root repo:

```bash
pnpm check
```

Bao gồm:

- `pnpm verify:bounds`: kiểm tra phụ thuộc chéo sai trong `package.json`.
- `pnpm lint`: kiểm tra import boundaries + style/lint.
- `pnpm typecheck`: kiểm tra TypeScript.

Nếu có thay đổi kiến trúc/module/routes và đã cập nhật Graphify context:

```bash
pnpm graphify:ai-summary
```

Hoặc chạy full:

```bash
pnpm check:full
```

## 5) Vòng Lặp Tự Điều Chỉnh (Agent Loop)

1. Đọc bản đồ (`SUMMARY_FOR_AI.md` + rules).
2. Chạy `pnpm check` (hoặc `pnpm check:full`).
3. Phân loại lỗi theo service (`@api`, `@frontend`, `@backend`, `packages/*`).
4. Sửa đúng phạm vi service gây lỗi, tránh refactor lan.
5. Chạy lại `pnpm check` đến khi exit code 0.

## 6) Tiêu Chí Hoàn Thành

- `pnpm check` pass.
- Không vi phạm boundaries giữa services.
- Không thêm phụ thuộc sai vào `package.json`.
- Nếu đổi cấu trúc app: đã cập nhật `SUMMARY_FOR_AI.md`.
