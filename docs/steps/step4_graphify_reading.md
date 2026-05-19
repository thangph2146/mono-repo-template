# Step 4: Graphify Reading

Đây là bước dùng Graphify để định vị file, module và import boundaries trước khi mở source.

## Các file Graphify cần đọc
1. ` .graphify/markdown/SUMMARY_FOR_AI.md`
   - Bản đồ monorepo tổng.
   - Liên kết tới `packages/` và từng app `apps/*`.
2. `packages/.graphify/markdown/SUMMARY_FOR_AI.md`
   - Tóm tắt package chia sẻ trong workspace.
   - Dùng khi task liên quan `packages/*` hoặc chia sẻ logic.
3. `apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md`
   - Bản đồ app storefront.
4. `apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md`
   - Bản đồ app admin backend.
5. `apps/api/.graphify/markdown/SUMMARY_FOR_AI.md`
   - Bản đồ app API và các module NestJS.

## Dùng mục "Chỉ dẫn theo chủ đề"
Trong mỗi `SUMMARY_FOR_AI.md`, tìm phần:
- `FOLDER_TREE.md`
- `GRAPH_STATS.md`
- `API_DOMAIN_IMPORTS.md`
- `WORKSPACE_DEPS.md`

Chọn tiếp theo dựa theo mục tiêu:
- Định vị file/route/module: dùng `FOLDER_TREE.md`.
- Hiểu điểm nóng import: mở `GRAPH_STATS.md`.
- Điều tra domain API / import NestJS: mở `API_DOMAIN_IMPORTS.md`.
- Xác nhận phụ thuộc package workspace: mở `WORKSPACE_DEPS.md`.

## Mục tiêu bước này
- Xác định chính xác app/module/dòng đọc cần mở.
- Giảm thiểu việc mở file không cần thiết.
- Hiểu được scope import và dependency boundaries.

## Ghi nhớ
- Tránh mở `apps/*/.graphify/snapshot/context.json` trừ khi cần trích đoạn cụ thể.
- Dùng Graphify summary trước, rồi mới mở source code cụ thể.
