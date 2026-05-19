# Thống kê graph — api (Graphify)

> **Sinh tự động:** `2026-05-19T09:31:09.606Z` từ `../snapshot/graph.json` — giúp AI nắm **quy mô** và **điểm nóng import** mà không mở full graph.

## Nodes theo `type`

| type | Số |
|------|-----|
| `ts` | 130 |
| `directory` | 34 |
| `json` | 2 |

## Links theo `relation`

| relation | Số |
|----------|-----|
| `imports` | 504 |
| `contains` | 165 |

## Top file theo số cạnh `imports` đi ra (out-degree)

Các file `src/...` import nhiều target nhất (thường là module barrel, service lớn, hoặc controller “dày”).

| File | Số cạnh imports |
|------|-----------------|
| `src/system/system.service.ts` | 26 |
| `src/app.module.ts` | 25 |
| `src/seed-full-export.ts` | 24 |
| `src/mikro-orm/orm-entities.ts` | 23 |
| `src/common/resolve-relation-filters.ts` | 13 |
| `src/entities/user.entity.ts` | 13 |
| `src/dashboard/dashboard.service.ts` | 12 |
| `src/posts/posts.service.ts` | 10 |
| `src/public/public.controller.ts` | 9 |
| `src/public/public.module.ts` | 9 |
| `src/messages/messages.controller.ts` | 8 |
| `src/users/users.controller.ts` | 8 |
| `src/groups/groups.controller.ts` | 7 |
| `src/page-contents/page-contents.controller.ts` | 7 |
| `src/roles/roles.controller.ts` | 7 |
| `src/sessions/sessions.controller.ts` | 7 |
| `src/sessions/sessions.service.ts` | 7 |
| `src/admission-results/admission-results.controller.ts` | 6 |
| `src/categories/categories.controller.ts` | 6 |
| `src/comments/comments.controller.ts` | 6 |

## Top file theo số cạnh `imports` đi vào (in-degree)

File được nhiều nguồn import tới (tiện ích dùng chung, entity, type, helper).

| File | Số lần bị import |
|------|------------------|
| `src/entities/user.entity.ts` | 32 |
| `src/config/constants.ts` | 31 |
| `src/common/api-response.ts` | 24 |
| `src/entities/notification.entity.ts` | 20 |
| `src/entities/base.entity.ts` | 20 |
| `src/notifications/notifications.service.ts` | 14 |
| `src/config/permissions.ts` | 13 |
| `src/notifications/notifications.module.ts` | 13 |
| `src/entities/role.entity.ts` | 13 |
| `src/entities/user-role.entity.ts` | 12 |
| `src/common/pagination.ts` | 12 |
| `src/entities/message.entity.ts` | 12 |
| `src/entities/post.entity.ts` | 11 |
| `src/entities/category.entity.ts` | 10 |
| `src/entities/post-category.entity.ts` | 9 |

## Làm mới

Chạy `node apps/api/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
