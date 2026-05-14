# Graphify — `@backend` (Hub admin Next)

Thư mục **`apps/backend/.graphify/`** chứa artefact Graphify cho admin Next.

- **`markdown/`** — file `.md` sinh cho Graphify của app này.
- **`snapshot/`** — `context.json` + `graph.json` từ `update.cjs`.

## File Markdown sinh (`pnpm graphify:ai-summary`)

| File | Mục đích |
|------|----------|
| `markdown/SUMMARY_FOR_AI.md` | Routes admin, module map (từ `../snapshot/context.json`). |
| `markdown/FOLDER_TREE.md` | Cây `src/` từ `../snapshot/graph.json`. |
| `markdown/GRAPH_STATS.md` | Quy mô graph, top in/out-degree. |

## Thứ tự đọc cho AI (ưu tiên)

1. **`markdown/SUMMARY_FOR_AI.md`**
2. **`markdown/FOLDER_TREE.md`**, **`markdown/GRAPH_STATS.md`**
3. **[Chỉ mục monorepo + chỉ dẫn theo chủ đề](../../../.graphify/markdown/SUMMARY_FOR_AI.md)**
4. **`snapshot/context.json`** — có chừng mực.
5. **`snapshot/graph.json`**, **`branch.json`**, **`manifest.json`**, **`cache/`**

## Làm mới

```bash
node .graphify/update.cjs
pnpm graphify:ai-summary
```

## Monorepo

- **Chỉ mục gốc:** `../../../.graphify/markdown/SUMMARY_FOR_AI.md`
- **Packages:** `../../../packages/.graphify/`
- **Storefront:** `apps/frontend/.graphify/`
