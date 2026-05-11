# Graphify — `@api` (NestJS, store-sync)

Service HTTP tách khỏi Next (`@frontend`, `@backend`). `.graphify` ở đây chỉ phục vụ **bản đồ import / module** từ `context.json`, không thay cho đọc `app.module.ts` hay Swagger.

## Thứ tự đọc cho AI

1. **`SUMMARY_FOR_AI.md`** — module/controller/entity/migration + bảng import (không full source).
2. **`context.json`** — có `content` đầy đủ từng file; dùng khi cần chi tiết, tránh đọc toàn bộ một lúc.
3. **`graph.json`** / **`cache/`** — đồ thị & cache graphifyy; **`cache/`** đã gitignore, không làm nguồn hiểu nghiệp vụ.

## Làm mới

Sau khi cập nhật `context.json` (pipeline Graphify / graphifyy):

```bash
pnpm graphify:ai-summary
```

## Monorepo

- **Admin UI:** `apps/backend` — có `.graphify` riêng.
- **Storefront:** `apps/frontend` — có `.graphify` riêng.
- Giao tiếp: HTTP + `@workspace/api-client` trên phía Next; `@api` không mirror UI vào đây.
