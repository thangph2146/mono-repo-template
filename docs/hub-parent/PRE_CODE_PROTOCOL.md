# Pre-Code Protocol For Agents

Tài liệu này là quy trình bắt buộc trước khi agent sửa code trong repo `hub-parent-template`.

Mục tiêu: agent phải hiểu kiến trúc microservice, docs feature, graph hiện tại, và boundary rule trước khi chỉnh source.

## 1. Luật bắt buộc

Trước khi sửa bất kỳ file code nào, agent phải đọc tài liệu theo đúng thứ tự bên dưới.

Nếu task liên quan một page/feature cụ thể, agent phải đọc docs feature trong `docs/pages/` trước khi mở hoặc sửa source chính của feature đó.

Agent phải thông báo ngắn gọn trong update đầu tiên rằng đã đọc hoặc sẽ đọc những tài liệu liên quan nào.

## 2. Thứ tự đọc tối thiểu

1. `docs/hub-parent/README.md`
2. `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md`
3. `docs/hub-parent/AGENTS_GUIDE.md`
4. `.graphify/markdown/SUMMARY_FOR_AI.md`
5. `packages/.graphify/markdown/SUMMARY_FOR_AI.md`
6. App Graphify summary tương ứng với phạm vi task:
   - `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md` khi sửa `apps/frontend`
   - `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md` khi sửa `apps/backend`
   - `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md` khi sửa `apps/api`
7. File Graphify chi tiết theo chủ đề nếu cần:
   - `FOLDER_TREE.md` khi cần định vị route/module/file
   - `GRAPH_STATS.md` khi cần hiểu import hotspots
   - `apps/api/.graphify/markdown/API_DOMAIN_IMPORTS.md` khi sửa domain API hoặc import NestJS
   - `packages/.graphify/markdown/WORKSPACE_DEPS.md` khi sửa package workspace
8. Docs feature/page tương ứng trong `docs/pages/`, nếu có.
9. Source code cụ thể.

Không mở `apps/*/.graphify/snapshot/context.json` trừ khi cần trích đoạn source cụ thể từ snapshot.

## 3. Mapping docs feature

Khi task đụng đến các route/module dưới đây, đọc docs tương ứng trước khi code:

| Phạm vi source | Docs bắt buộc |
|---|---|
| `apps/backend/src/app/categories/**` | `docs/pages/categories-implementation.md` |
| `apps/backend/src/app/contact-requests/**` | `docs/pages/contact-requests-implementation.md` |
| `apps/backend/src/app/data/**` | `docs/pages/data-implementation.md` |
| `apps/backend/src/app/guides/**` | `docs/pages/guides-implementation.md` |
| `apps/backend/src/app/my-students/**` | `docs/pages/my-students-implementation.md` |
| `apps/backend/src/app/parent-students/**` | `docs/pages/parent-students-implementation.md` |
| `apps/backend/src/app/posts/**` | `docs/pages/posts-implementation.md` |
| `apps/backend/src/app/profile/**` | `docs/pages/profile-implementation.md` |
| `apps/backend/src/app/rbac/**` | `docs/pages/rbac-implementation.md` |
| `apps/backend/src/app/staff/**` | `docs/pages/staff-implementation.md` |
| `apps/backend/src/app/tags/**` | `docs/pages/tags-implementation.md` |

Nếu không tìm thấy docs feature tương ứng, agent phải nói rõ: "Không tìm thấy docs feature tương ứng", rồi tiếp tục bằng Graphify + source code.

## 4. Boundary checklist trước khi sửa

Trước khi code, agent phải tự đối chiếu:

- Không import chéo source giữa `apps/*`.
- `apps/frontend` và `apps/backend` gọi `apps/api` qua HTTP và `@workspace/api-client`.
- Entity, MikroORM, migrations, seeders, business logic database chỉ thuộc `apps/api`.
- Logic dùng chung không phụ thuộc runtime app thì đặt trong `packages/*` khi thật sự cần share.
- Không thêm dependency sai boundary vào `package.json`.

## 5. Quy trình khi bắt đầu một task code

1. Xác định task thuộc app/package/feature nào.
2. Đọc docs theo thứ tự trong tài liệu này.
3. Đọc docs feature trong `docs/pages/` nếu task là admin page/module.
4. Đọc Graphify files đúng chủ đề.
5. Trace import của file target và các API-client method liên quan.
6. Chỉ sửa code sau khi đã hiểu luồng dữ liệu đúng.
7. Sau khi sửa, chạy `pnpm check`.
8. Nếu đổi kiến trúc/module/routes đáng kể, chạy graphify update theo `AGENTS.md` rồi chạy `pnpm check:full`.

## 6. Khi làm việc với `parent-students`

Với mọi task liên quan `apps/backend/src/app/parent-students/**`, agent phải đọc:

1. `docs/pages/parent-students-implementation.md`
2. `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`
3. `apps/backend/.graphify/markdown/FOLDER_TREE.md`
4. `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`
5. `packages/.graphify/markdown/SUMMARY_FOR_AI.md`
6. Source target trong `apps/backend/src/app/parent-students/**`
7. API client source liên quan trong `packages/*` hoặc import path tương ứng

Sau đó mới sửa component, hook, query, table, hoặc form của feature.
