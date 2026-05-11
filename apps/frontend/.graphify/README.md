# Graphify — `@frontend` (store-sync)

Thư mục này phục vụ **đồ thị / ngữ cảnh codebase** cho người và cho AI. Trong monorepo, **mỗi app giữ `.graphify` riêng** — không gộp với `@backend` hay `@api`.

## Thứ tự đọc cho AI (ưu tiên)

1. **`SUMMARY_FOR_AI.md`** — bản gọn: routes, bảng import/export, không nhúng full source.
2. **`context.json`** — đầy đủ (có `content` từng file): chỉ dùng khi cần trích đoạn cụ thể; rất tốn ngữ cảnh.
3. **`graph.json`** — nút/cạnh cho visualization hoặc công cụ graphifyy.
4. **`GRAPH_REPORT.md`** — báo cáo community từ graphifyy; **cần chạy lại graphify** nếu số liệu không khớp repo hiện tại.
5. **`cache/`** — cache nội bộ; **không** dùng làm nguồn hiểu kiến trúc.

## Làm mới dữ liệu

- Script local: `update.cjs` (đồ thị tùy biến trong repo).
- Hoặc CLI [graphifyy](https://www.npmjs.com/package/graphifyy) theo skill `/graphify`.
- Sau khi có `context.json` mới, từ **root monorepo**:

  ```bash
  pnpm graphify:ai-summary
  ```

## Lưu ý

- **`manifest.json`** chỉ lưu mtime theo đường dẫn tuyệt đối; nếu lệch project, xoá hoặc để `{}` rồi chạy lại công cụ sinh graph.
- **API Nest** (`apps/api`) có `.graphify` riêng + `SUMMARY_FOR_AI.md` — không trộn với repo này.
