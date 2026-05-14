# Microservice System Map (hub-parent-template)

Tài liệu này là bản đồ nhanh để AI/agent hiểu đúng kiến trúc microservice trong monorepo trước khi đọc code, chạy kiểm tra, và tự điều chỉnh.

## 1) Service Boundaries

- `@api` (`apps/api`): NestJS + **MikroORM** (entity, migrations, seeders; cấu hình runtime `src/config/database.config.ts`, CLI `mikro-orm.config.ts`, script `orm` / `db:*` trong `apps/api/package.json`).
- `@frontend` (`apps/frontend`): Storefront Next.js cho người dùng cuối.
- `@backend` (`apps/backend`): Admin Next.js cho vận hành nội bộ.

Nguyên tắc:

- Không import chéo source giữa các app trong `apps/*`.
- Frontend/Backend gọi API qua HTTP và `@workspace/api-client`.
- Logic chia sẻ không phụ thuộc runtime app đặt ở `packages/*` khi còn tồn tại trong workspace.

## 2) Shared Packages

- `@workspace/api-client`: SDK/contract để gọi `@api`.
- `@workspace/query-client`: cấu hình `QueryClient` / TanStack Query dùng chung cho Next apps.
- `@ui`: component/UI primitives dùng cho Next apps.
- `@thangph2146/lexical-editor`: editor Lexical (workspace package `packages/editor`).
- `@workspace/eslint-config`: lint rules + service boundaries.
- `@workspace/typescript-config`: tsconfig dùng chung.

## 3) Graphify — theo dõi kiến trúc cho AI

- **Chỉ mục monorepo:** `.graphify/markdown/SUMMARY_FOR_AI.md` (liên kết tới từng app + `packages/.graphify/markdown/`).
- **Chỉ dẫn theo chủ đề (AI):** mục *Chỉ dẫn theo chủ đề* trong `.graphify/markdown/SUMMARY_FOR_AI.md` — bảng *mục tiêu → file đọc trước*.
- **Danh sách package:** `packages/.graphify/markdown/SUMMARY_FOR_AI.md`.
- **Phụ thuộc `workspace:*`:** `packages/.graphify/markdown/WORKSPACE_DEPS.md`.
- **Từng dịch vụ:** `apps/<frontend|backend|api>/.graphify/markdown/SUMMARY_FOR_AI.md` (sinh từ `snapshot/context.json`).
- **Cây thư mục / thống kê graph:** `apps/<app>/.graphify/markdown/FOLDER_TREE.md`, `GRAPH_STATS.md`.
- **Phụ thuộc domain API:** `apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md` (bảng, inbound, Mermaid).
- Làm mới snapshot: `node apps/<app>/.graphify/update.cjs` rồi `pnpm graphify:ai-summary` từ root.
- **Checklist sau chuẩn hóa:** `.graphify/README.md` (mục *Checklist sau chuẩn hóa / refactor kiến trúc*).

## 4) Thứ Tự Đọc Khuyến Nghị Cho AI

1. `.graphify/markdown/SUMMARY_FOR_AI.md` (bản đồ tổng + link)
2. `packages/.graphify/markdown/SUMMARY_FOR_AI.md`
3. `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`
4. `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`
5. `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`
6. `packages/eslint-config/service-boundaries.js`
7. `scripts/verify-service-boundaries.mjs`
8. File source cụ thể liên quan task

Lưu ý:

- Tránh đọc toàn bộ `apps/*/.graphify/snapshot/context.json` nếu chưa cần, vì file lớn và nhúng full source.
- Dùng `SUMMARY_FOR_AI.md` để định vị module trước, sau đó mở đúng file mục tiêu.
- Cây `src/` và phụ thuộc domain API (import chéo): `apps/<app>/.graphify/markdown/FOLDER_TREE.md`, `apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md`.
- Thống kê graph (điểm nóng import): `apps/<app>/.graphify/markdown/GRAPH_STATS.md`.
- Chỉ dẫn theo chủ đề: mục **Chỉ dẫn theo chủ đề** trong `.graphify/markdown/SUMMARY_FOR_AI.md`; phụ thuộc `workspace:*`: `packages/.graphify/markdown/WORKSPACE_DEPS.md`.

## 5) Quy Trình Kiểm Tra Chuẩn

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

## 6) Vòng Lặp Tự Điều Chỉnh (Agent Loop)

1. Đọc bản đồ (`.graphify/markdown/SUMMARY_FOR_AI.md`, `packages/.graphify/markdown/`, app SUMMARY + rules).
2. Chạy `pnpm check` (hoặc `pnpm check:full`).
3. Phân loại lỗi theo service (`@api`, `@frontend`, `@backend`, `packages/*`).
4. Sửa đúng phạm vi service gây lỗi, tránh refactor lan.
5. Chạy lại `pnpm check` đến khi exit code 0.

## 7) Tiêu Chí Hoàn Thành

- `pnpm check` pass.
- Không vi phạm boundaries giữa services.
- Không thêm phụ thuộc sai vào `package.json`.
- Nếu đổi cấu trúc app đáng kể: đã chạy `update.cjs` + `pnpm graphify:ai-summary` (SUMMARY / chỉ mục monorepo).
