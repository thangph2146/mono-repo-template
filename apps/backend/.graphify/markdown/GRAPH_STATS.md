# Thống kê graph — backend (Graphify)

> **Sinh tự động:** `2026-05-18T04:13:35.278Z` từ `../snapshot/graph.json` — giúp AI nắm **quy mô** và **điểm nóng import** mà không mở full graph.

## Nodes theo `type`

| type | Số |
|------|-----|
| `ts` | 52 |
| `directory` | 43 |
| `tsx` | 26 |
| `page` | 20 |
| `layout` | 1 |
| `loading` | 1 |

## Links theo `relation`

| relation | Số |
|----------|-----|
| `imports` | 200 |
| `contains` | 141 |
| `assets` | 1 |
| `renders` | 1 |

## Top file theo số cạnh `imports` đi ra (out-degree)

Các file `src/...` import nhiều target nhất (thường là module barrel, service lớn, hoặc controller “dày”).

| File | Số cạnh imports |
|------|-----------------|
| `src/app/categories/_component/index.ts` | 8 |
| `src/app/posts/page.tsx` | 8 |
| `src/app/rbac/page.tsx` | 8 |
| `src/app/staff/page.tsx` | 8 |
| `src/app/tags/page.tsx` | 7 |
| `src/app/categories/page.tsx` | 6 |
| `src/app/contact-requests/page.tsx` | 6 |
| `src/app/posts/_component/index.ts` | 6 |
| `src/components/admin-shell.tsx` | 6 |
| `src/lib/index.ts` | 6 |
| `src/app/categories/[id]/page.tsx` | 5 |
| `src/app/profile/page.tsx` | 5 |
| `src/app/categories/[id]/edit/page.tsx` | 4 |
| `src/app/page.tsx` | 4 |
| `src/app/parent-students/page.tsx` | 4 |
| `src/app/posts/new/page.tsx` | 4 |
| `src/app/posts/[id]/edit/page.tsx` | 4 |
| `src/features/auth/sign-in-form.tsx` | 4 |
| `src/app/categories/new/page.tsx` | 3 |
| `src/app/categories/_component/_dialog/categories-form-dialog.tsx` | 3 |

## Top file theo số cạnh `imports` đi vào (in-degree)

File được nhiều nguồn import tới (tiện ích dùng chung, entity, type, helper).

| File | Số lần bị import |
|------|------------------|
| `src/lib/api.ts` | 19 |
| `src/components/admin-page-guard.tsx` | 13 |
| `src/providers/auth-provider.tsx` | 13 |
| `src/app/categories/_component/types.ts` | 12 |
| `src/app/posts/_component/types.ts` | 12 |
| `src/hooks/use-debounced-value.ts` | 7 |
| `src/components/admin-confirm-action-dialog.tsx` | 7 |
| `src/components/admin-table-pagination-footer.tsx` | 7 |
| `src/lib/auth-session.ts` | 7 |
| `src/app/posts/_component/utils.ts` | 6 |
| `src/lib/category-icons.ts` | 4 |
| `src/lib/auth-routes.ts` | 4 |
| `src/features/auth/auth-api.ts` | 4 |
| `src/hooks/queries.ts` | 3 |
| `src/app/categories/_component/utils.ts` | 2 |

## Làm mới

Chạy `node apps/backend/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
