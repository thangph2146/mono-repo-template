# Graphify — `@frontend` (Hub storefront)

Thư mục **`apps/frontend/.graphify/`** chứa artefact Graphify cho storefront Next (HUB công khai).

- **`markdown/`** — mọi `.md` sinh bởi `pnpm graphify:ai-summary` (đúng scope app).
- **`snapshot/`** — `context.json` + `graph.json` từ `update.cjs` (JSON nặng, tránh mở bừa).

## File Markdown sinh (`pnpm graphify:ai-summary`)

| File | Mục đích |
|------|----------|
| `markdown/SUMMARY_FOR_AI.md` | Routes, module map, import/export (từ `../snapshot/context.json`). |
| `markdown/FOLDER_TREE.md` | Cây thư mục `src/` từ `../snapshot/graph.json`. |
| `markdown/GRAPH_STATS.md` | Quy mô graph, top in/out-degree. |

## Thứ tự đọc cho AI (ưu tiên)

1. **`markdown/SUMMARY_FOR_AI.md`** — định vị nhanh; không nhúng full source.
2. **`markdown/FOLDER_TREE.md`**, **`markdown/GRAPH_STATS.md`** — cấu trúc + điểm nóng import.
3. **[Chỉ mục monorepo + chỉ dẫn theo chủ đề](../../../.graphify/markdown/SUMMARY_FOR_AI.md)** — khi cần liên kết sang `packages/` hoặc app khác.
4. **`snapshot/context.json`** — chỉ khi cần trích đoạn (file lớn).
5. **`snapshot/graph.json`**, **`GRAPH_REPORT.md`**, **`cache/`** — visualization / cache; `cache/` không dùng làm nguồn hiểu business.

## Làm mới dữ liệu

```bash
# từ thư mục app (hoặc dùng đường dẫn đầy đủ từ root monorepo)
node .graphify/update.cjs
pnpm graphify:ai-summary
```

## Monorepo

- **Chỉ mục gốc:** `../../../.graphify/markdown/SUMMARY_FOR_AI.md`
- **Packages:** `../../../packages/.graphify/` (`README.md`, `markdown/SUMMARY_FOR_AI.md`, `markdown/WORKSPACE_DEPS.md`)
- **API Nest:** `apps/api/.graphify/`
