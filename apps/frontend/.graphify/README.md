# Graphify — `apps/frontend`

Thư mục `.graphify/` giữ **snapshot** (`snapshot/`) và **Markdown cho AI** (`markdown/`).

## File trong thư mục này

| File / Thư mục | Mục đích |
|----------------|----------|
| `snapshot/graph.json` | Đồ thị node/link (sinh bởi `node scripts/graphify-update.cjs apps/frontend`) |
| `snapshot/context.json` | Snapshot nội dung file (<30KB) để AI hiểu hệ thống |
| `markdown/SUMMARY_FOR_AI.md` | Tóm tắt module map, routes, stats (sinh bởi `pnpm graphify:ai-summary`) |
| `markdown/FOLDER_TREE.md` | Cây thư mục `src/` dạng ASCII |
| `markdown/GRAPH_STATS.md` | Thống kê graph: node/link count, top in/out-degree |
| `README.md` | Mô tả layout thư mục (file này) |

## Làm mới

```bash
node scripts/graphify-update.cjs apps/frontend
pnpm graphify:ai-summary
```

## Liên kết

- [SUMMARY monorepo](../../../.graphify/markdown/SUMMARY_FOR_AI.md)
- [packages SUMMARY](../../../packages/.graphify/markdown/SUMMARY_FOR_AI.md)
