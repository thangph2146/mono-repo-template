# Thống kê graph — backend (Graphify)

> **Sinh tự động:** `2026-05-28T01:55:02.253Z` từ `../snapshot/graph.json` — giúp AI nắm **quy mô** và **điểm nóng import** mà không mở full graph.

## Nodes theo `type`

| type | Số |
|------|-----|
| `ts` | 106 |
| `directory` | 88 |
| `tsx` | 54 |
| `page` | 33 |
| `api-route` | 1 |
| `layout` | 1 |
| `loading` | 1 |

## Links theo `relation`

| relation | Số |
|----------|-----|
| `imports` | 413 |
| `contains` | 282 |
| `assets` | 1 |
| `renders` | 1 |

## Top file theo số cạnh `imports` đi ra (out-degree)

Các file `src/...` import nhiều target nhất (thường là module barrel, service lớn, hoặc controller “dày”).

| File | Số cạnh imports |
|------|-----------------|
| `src/app/rbac/page.tsx` | 10 |
| `src/app/parent-students/page.tsx` | 9 |
| `src/app/categories/_component/index.ts` | 8 |
| `src/app/contact-requests/_component/index.ts` | 8 |
| `src/app/guides/_component/index.ts` | 8 |
| `src/app/posts/page.tsx` | 8 |
| `src/app/staff/_component/index.ts` | 8 |
| `src/app/tags/_component/index.ts` | 8 |
| `src/app/contact-requests/page.tsx` | 7 |
| `src/app/staff/[id]/page.tsx` | 7 |
| `src/app/categories/page.tsx` | 6 |
| `src/app/contact-requests/_component/_table/contact-table.tsx` | 6 |
| `src/app/contact-requests/_component/_table/contact-trash-table.tsx` | 6 |
| `src/app/posts/_component/index.ts` | 6 |
| `src/app/profile/page.tsx` | 6 |
| `src/app/staff/new/page.tsx` | 6 |
| `src/app/staff/page.tsx` | 6 |
| `src/app/staff/[id]/edit/page.tsx` | 6 |
| `src/components/admin-shell.tsx` | 6 |
| `src/lib/index.ts` | 6 |

## Top file theo số cạnh `imports` đi vào (in-degree)

File được nhiều nguồn import tới (tiện ích dùng chung, entity, type, helper).

| File | Số lần bị import |
|------|------------------|
| `src/lib/api.ts` | 34 |
| `src/components/admin-page-guard.tsx` | 29 |
| `src/providers/auth-provider.tsx` | 15 |
| `src/app/posts/_component/types.ts` | 13 |
| `src/app/guides/_component/types.ts` | 11 |
| `src/components/admin-table-pagination-footer.tsx` | 10 |
| `src/hooks/queries.ts` | 10 |
| `src/hooks/use-debounced-value.ts` | 9 |
| `src/app/categories/_component/types.ts` | 9 |
| `src/app/tags/_component/types.ts` | 9 |
| `src/components/admin-confirm-action-dialog.tsx` | 8 |
| `src/lib/auth-session.ts` | 8 |
| `src/app/contact-requests/_component/types.ts` | 7 |
| `src/app/guides/_component/utils.ts` | 5 |
| `src/types/student-scores.ts` | 5 |

## Làm mới

Chạy `node apps/backend/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
