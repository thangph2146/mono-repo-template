# Graphify — `@api` (NestJS, Hub)

Thư mục **`apps/api/.graphify/`** chứa artefact Graphify cho Nest API.

- **`markdown/`** — toàn bộ file `.md` sinh cho đồ thị / AI của service này.
- **`snapshot/`** — `context.json` + `graph.json` từ `update.cjs`.

## File Markdown sinh (`pnpm graphify:ai-summary`)

| File | Mục đích |
|------|----------|
| `markdown/SUMMARY_FOR_AI.md` | Module/controller/entity + bảng import (từ `../snapshot/context.json`). |
| `markdown/FOLDER_TREE.md` | Cây `src/` từ `../snapshot/graph.json`. |
| `markdown/GRAPH_STATS.md` | Quy mô node/link, top in/out-degree. |
| `markdown/API_DOMAIN_IMPORTS.md` | Phụ thuộc domain Nest (bảng, inbound, Mermaid). |

## Thứ tự đọc cho AI

1. **`markdown/SUMMARY_FOR_AI.md`**
2. **`markdown/API_DOMAIN_IMPORTS.md`**, **`markdown/GRAPH_STATS.md`**, **`markdown/FOLDER_TREE.md`**
3. **[Chỉ mục monorepo + chỉ dẫn theo chủ đề](../../../.graphify/markdown/SUMMARY_FOR_AI.md)**
4. **`snapshot/context.json`**, **`snapshot/graph.json`** / **`cache/`**

## Làm mới

```bash
node .graphify/update.cjs
pnpm graphify:ai-summary
```

## Monorepo

- **Chỉ mục gốc:** `../../../.graphify/markdown/SUMMARY_FOR_AI.md`
- **Next apps:** `apps/frontend/.graphify/`, `apps/backend/.graphify/`
