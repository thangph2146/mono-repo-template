# Thống kê graph — backend (Graphify)

> **Sinh tự động:** `2026-05-14T03:45:43.548Z` từ `../snapshot/graph.json` — giúp AI nắm **quy mô** và **điểm nóng import** mà không mở full graph.

## Nodes theo `type`

| type | Số |
|------|-----|
| `ts` | 21 |
| `directory` | 20 |
| `page` | 11 |
| `tsx` | 11 |
| `layout` | 1 |
| `loading` | 1 |

## Links theo `relation`

| relation | Số |
|----------|-----|
| `imports` | 77 |
| `contains` | 63 |
| `assets` | 1 |
| `renders` | 1 |

## Top file theo số cạnh `imports` đi ra (out-degree)

Các file `src/...` import nhiều target nhất (thường là module barrel, service lớn, hoặc controller “dày”).

| File | Số cạnh imports |
|------|-----------------|
| `src/app/categories/page.tsx` | 8 |
| `src/app/rbac/page.tsx` | 8 |
| `src/app/staff/page.tsx` | 7 |
| `src/app/contact-requests/page.tsx` | 6 |
| `src/app/tags/page.tsx` | 6 |
| `src/app/posts/page.tsx` | 5 |
| `src/app/profile/page.tsx` | 5 |
| `src/components/admin-shell.tsx` | 5 |
| `src/features/auth/sign-in-form.tsx` | 4 |
| `src/app/layout.tsx` | 3 |
| `src/components/admin-data-table/admin-data-table.tsx` | 3 |
| `src/providers/auth-provider.tsx` | 3 |
| `src/components/sidebar.tsx` | 2 |
| `src/features/auth/index.ts` | 2 |
| `src/features/auth/register-form.tsx` | 2 |
| `src/app/data/page.tsx` | 1 |
| `src/app/login/page.tsx` | 1 |
| `src/app/page.tsx` | 1 |
| `src/app/register/page.tsx` | 1 |
| `src/components/admin-data-table/index.ts` | 1 |

## Top file theo số cạnh `imports` đi vào (in-degree)

File được nhiều nguồn import tới (tiện ích dùng chung, entity, type, helper).

| File | Số lần bị import |
|------|------------------|
| `src/providers/auth-provider.tsx` | 10 |
| `src/lib/api.ts` | 9 |
| `src/components/admin-table-pagination-footer.tsx` | 6 |
| `src/components/admin-confirm-action-dialog.tsx` | 6 |
| `src/hooks/use-debounced-value.ts` | 6 |
| `src/lib/auth-session.ts` | 6 |
| `src/hooks/queries.ts` | 4 |
| `src/lib/auth-routes.ts` | 4 |
| `src/features/auth/auth-api.ts` | 4 |
| `src/features/auth/sign-in-form.tsx` | 2 |
| `src/lib/permission-labels.ts` | 2 |
| `src/features/auth/register-form.tsx` | 2 |
| `src/lib/category-icons.ts` | 1 |
| `src/providers/query-provider.tsx` | 1 |
| `src/components/admin-shell.tsx` | 1 |

## Làm mới

Chạy `node apps/backend/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
