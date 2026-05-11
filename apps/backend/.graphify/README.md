# Graphify — `@backend` (admin Next, store-sync)

Tách biệt với `@frontend` và `@api`: đây chỉ là **admin UI** (Next.js). AI nên coi đây là một service hiển thị, gọi API qua `@workspace/api-client` / HTTP.

## Thứ tự đọc cho AI (ưu tiên)

1. **`SUMMARY_FOR_AI.md`** — tóm tắt routes + map import/export (không full source).
2. **`context.json`** — chi tiết + toàn bộ `content` file: dùng có chừng mực.
3. **`graph.json`**, **`branch.json`**, **`manifest.json`** — metadata đồ thị / incremental.
4. **`cache/`** — cache graphifyy; có thể rất lớn; đã **gitignore**; không đọc để hiểu business logic.

## Làm mới

```bash
# Sau khi cập nhật context.json (graphify / pipeline nội bộ)
pnpm graphify:ai-summary
```

## Monorepo

- **API Nest** ở `apps/api` — có `.graphify` + `SUMMARY_FOR_AI.md` riêng; logic HTTP/MikroORM đọc từ đó hoặc `apps/api/src`.
