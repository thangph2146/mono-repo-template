# API — phụ thuộc giữa các domain (`src/`)

> **Sinh tự động:** `2026-05-19T01:18:41.658Z` từ `snapshot/graph.json` (cạnh `relation: "imports"`).
> **Domain** = thư mục cấp một dưới `src/` (ví dụ `posts`, `users`). File trực tiếp trong `src/*.ts` gom vào domain `_root`.

Ý nghĩa: **domain hàng gọi (import) domain cột** — Nest module/controller/service trong một feature đang dùng code của feature khác hoặc layer dùng chung (`entities`, `common`, …).

## Bảng phụ thuộc chéo (gộp)

| Domain gọi | Domain được import | Số cạnh import | Ví dụ (tên file) |
|-------------|---------------------|----------------|------------------|
| `_root` | `accounts` | 1 | app.module.ts → accounts.module.ts |
| `_root` | `admission-results` | 1 | app.module.ts → admission-results.module.ts |
| `_root` | `auth` | 1 | app.module.ts → auth.module.ts |
| `_root` | `categories` | 1 | app.module.ts → categories.module.ts |
| `_root` | `comments` | 1 | app.module.ts → comments.module.ts |
| `_root` | `common` | 4 | main.ts → logging.interceptor.ts; main.ts → database-http-exception.filter.ts; main.ts → request-id.middleware.ts; main.ts → api-access.middleware.ts |
| `_root` | `config` | 1 | main.ts → app.config.ts |
| `_root` | `contact-requests` | 1 | app.module.ts → contact-requests.module.ts |
| `_root` | `dashboard` | 1 | app.module.ts → dashboard.module.ts |
| `_root` | `entities` | 26 | seed-full-export.ts → account.entity.ts; seed-full-export.ts → admission-result.entity.ts; seed-full-export.ts → category.entity.ts; seed-full-export.ts → comment.entity.ts |
| `_root` | `groups` | 1 | app.module.ts → groups.module.ts |
| `_root` | `messages` | 1 | app.module.ts → messages.module.ts |
| `_root` | `mikro-orm` | 2 | app.module.ts → mikro-orm.module.ts; seed-full-export.ts → orm-entities.ts |
| `_root` | `notifications` | 1 | app.module.ts → notifications.module.ts |
| `_root` | `page-contents` | 1 | app.module.ts → page-contents.module.ts |
| `_root` | `posts` | 1 | app.module.ts → posts.module.ts |
| `_root` | `proxy-image` | 1 | app.module.ts → proxy-image.module.ts |
| `_root` | `public` | 1 | app.module.ts → public.module.ts |
| `_root` | `roles` | 1 | app.module.ts → roles.module.ts |
| `_root` | `seeds` | 1 | seed-superadmin.ts → superadmin-bootstrap.runner.ts |
| `_root` | `sessions` | 1 | app.module.ts → sessions.module.ts |
| `_root` | `settings` | 1 | app.module.ts → settings.module.ts |
| `_root` | `socket` | 1 | app.module.ts → socket.module.ts |
| `_root` | `students` | 1 | app.module.ts → students.module.ts |
| `_root` | `system` | 2 | app.module.ts → system.module.ts; seed-full-export.ts → import-helpers.ts |
| `_root` | `tags` | 1 | app.module.ts → tags.module.ts |
| `_root` | `uploads` | 1 | app.module.ts → uploads.module.ts |
| `_root` | `users` | 1 | app.module.ts → users.module.ts |
| `accounts` | `common` | 1 | accounts.controller.ts → api-response.ts |
| `accounts` | `config` | 1 | accounts.controller.ts → constants.ts |
| `accounts` | `entities` | 2 | accounts.service.ts → user.entity.ts; accounts.service.ts → user-role.entity.ts |
| `admission-results` | `common` | 3 | admission-results.controller.ts → api-response.ts; admission-results.service.ts → pagination.ts; admission-results.service.ts → date-utils.ts |
| `admission-results` | `config` | 2 | admission-results.controller.ts → constants.ts; admission-results.controller.ts → permissions.ts |
| `admission-results` | `entities` | 2 | admission-results.controller.ts → notification.entity.ts; admission-results.service.ts → admission-result.entity.ts |
| `admission-results` | `notifications` | 2 | admission-results.controller.ts → notifications.service.ts; admission-results.module.ts → notifications.module.ts |
| `auth` | `common` | 1 | auth-admin.controller.ts → api-response.ts |
| `auth` | `config` | 2 | auth-admin.controller.ts → constants.ts; auth.service.ts → constants.ts |
| `auth` | `entities` | 3 | auth.service.ts → user.entity.ts; auth.service.ts → role.entity.ts; auth.service.ts → user-role.entity.ts |
| `categories` | `common` | 2 | categories.controller.ts → api-response.ts; categories.service.ts → pagination.ts |
| `categories` | `config` | 2 | categories.controller.ts → constants.ts; categories.controller.ts → permissions.ts |
| `categories` | `entities` | 3 | categories.controller.ts → notification.entity.ts; categories.service.ts → category.entity.ts; categories.service.ts → post-category.entity.ts |
| `categories` | `notifications` | 2 | categories.controller.ts → notifications.service.ts; categories.module.ts → notifications.module.ts |
| `comments` | `common` | 2 | comments.controller.ts → api-response.ts; comments.service.ts → pagination.ts |
| `comments` | `config` | 2 | comments.controller.ts → constants.ts; comments.controller.ts → permissions.ts |
| `comments` | `entities` | 2 | comments.controller.ts → notification.entity.ts; comments.service.ts → comment.entity.ts |
| `comments` | `notifications` | 2 | comments.controller.ts → notifications.service.ts; comments.module.ts → notifications.module.ts |
| `common` | `config` | 3 | api-access.middleware.ts → constants.ts; logging.interceptor.ts → app.config.ts; logging.interceptor.ts → constants.ts |
| `common` | `entities` | 13 | resolve-relation-filters.ts → admission-result.entity.ts; resolve-relation-filters.ts → category.entity.ts; resolve-relation-filters.ts → contact-request.entity.ts; resolve-relation-filters.ts → group.entity.ts |
| `contact-requests` | `common` | 3 | contact-requests.controller.ts → api-response.ts; contact-requests.service.ts → pagination.ts; contact-requests.service.ts → date-utils.ts |
| `contact-requests` | `config` | 2 | contact-requests.controller.ts → constants.ts; contact-requests.controller.ts → permissions.ts |
| `contact-requests` | `entities` | 3 | contact-requests.controller.ts → notification.entity.ts; contact-requests.service.ts → contact-request.entity.ts; contact-requests.service.ts → user.entity.ts |
| `contact-requests` | `notifications` | 2 | contact-requests.controller.ts → notifications.service.ts; contact-requests.module.ts → notifications.module.ts |
| `dashboard` | `common` | 1 | dashboard.controller.ts → api-response.ts |
| `dashboard` | `config` | 1 | dashboard.controller.ts → constants.ts |
| `dashboard` | `entities` | 12 | dashboard.service.ts → category.entity.ts; dashboard.service.ts → comment.entity.ts; dashboard.service.ts → contact-request.entity.ts; dashboard.service.ts → message.entity.ts |
| `groups` | `common` | 1 | groups.controller.ts → api-response.ts |
| `groups` | `config` | 2 | groups.controller.ts → constants.ts; groups.controller.ts → permissions.ts |
| `groups` | `entities` | 6 | groups.controller.ts → notification.entity.ts; groups.service.ts → group.entity.ts; groups.service.ts → group-member.entity.ts; groups.service.ts → message.entity.ts |
| `groups` | `notifications` | 2 | groups.controller.ts → notifications.service.ts; groups.module.ts → notifications.module.ts |
| `groups` | `socket` | 2 | groups.controller.ts → socket.gateway.ts; groups.module.ts → socket.module.ts |
| `messages` | `common` | 2 | conversations.controller.ts → api-response.ts; messages.controller.ts → api-response.ts |
| `messages` | `config` | 2 | conversations.controller.ts → constants.ts; messages.controller.ts → constants.ts |
| `messages` | `entities` | 6 | conversations.controller.ts → message.entity.ts; messages.controller.ts → message.entity.ts; messages.controller.ts → message-read.entity.ts; messages.controller.ts → group-member.entity.ts |
| `messages` | `socket` | 3 | conversations.controller.ts → socket.gateway.ts; messages.controller.ts → socket.gateway.ts; messages.module.ts → socket.module.ts |
| `mikro-orm` | `entities` | 22 | orm-entities.ts → account.entity.ts; orm-entities.ts → admission-result.entity.ts; orm-entities.ts → category.entity.ts; orm-entities.ts → comment.entity.ts |
| `notifications` | `common` | 1 | notifications.controller.ts → api-response.ts |
| `notifications` | `config` | 1 | notifications.controller.ts → constants.ts |
| `notifications` | `entities` | 5 | notifications.service.ts → notification.entity.ts; notifications.service.ts → user.entity.ts; notifications.service.ts → user-role.entity.ts; notifications.service.ts → message.entity.ts |
| `page-contents` | `auth` | 2 | page-contents.controller.ts → auth.service.ts; page-contents.module.ts → auth.module.ts |
| `page-contents` | `common` | 1 | page-contents.controller.ts → api-response.ts |
| `page-contents` | `config` | 2 | page-contents.controller.ts → constants.ts; page-contents.controller.ts → permissions.ts |
| `page-contents` | `entities` | 2 | page-contents.controller.ts → notification.entity.ts; page-contents.service.ts → page-content.entity.ts |
| `page-contents` | `notifications` | 2 | page-contents.controller.ts → notifications.service.ts; page-contents.module.ts → notifications.module.ts |
| `posts` | `common` | 5 | posts.controller.ts → api-response.ts; posts.service.ts → resolve-relation-filters.ts; posts.service.ts → pagination.ts; posts.service.ts → get-options.ts |
| `posts` | `config` | 2 | posts.controller.ts → constants.ts; posts.controller.ts → permissions.ts |
| `posts` | `entities` | 7 | posts.controller.ts → notification.entity.ts; posts.service.ts → post.entity.ts; posts.service.ts → post-category.entity.ts; posts.service.ts → post-tag.entity.ts |
| `posts` | `notifications` | 2 | posts.controller.ts → notifications.service.ts; posts.module.ts → notifications.module.ts |
| `proxy-image` | `config` | 1 | proxy-image.controller.ts → constants.ts |
| `public` | `admission-results` | 2 | public.controller.ts → admission-results.service.ts; public.module.ts → admission-results.module.ts |
| `public` | `auth` | 2 | public-auth.service.ts → auth.service.ts; public.module.ts → auth.module.ts |
| `public` | `common` | 2 | public-posts.service.ts → pagination.ts; public.controller.ts → api-response.ts |
| `public` | `config` | 2 | public-auth.service.ts → constants.ts; public.controller.ts → constants.ts |
| `public` | `entities` | 9 | public-auth.service.ts → role.entity.ts; public-auth.service.ts → user.entity.ts; public-categories.service.ts → category.entity.ts; public-categories.service.ts → post-category.entity.ts |
| `public` | `page-contents` | 2 | public.controller.ts → page-contents.service.ts; public.module.ts → page-contents.module.ts |
| `public` | `users` | 3 | public-auth.service.ts → users.service.ts; public.controller.ts → users.service.ts; public.module.ts → users.module.ts |
| `roles` | `common` | 3 | roles.controller.ts → api-response.ts; roles.service.ts → pagination.ts; roles.service.ts → get-options.ts |
| `roles` | `config` | 2 | roles.controller.ts → constants.ts; roles.controller.ts → permissions.ts |
| `roles` | `entities` | 2 | roles.controller.ts → notification.entity.ts; roles.service.ts → role.entity.ts |
| `roles` | `notifications` | 2 | roles.controller.ts → notifications.service.ts; roles.module.ts → notifications.module.ts |
| `roles` | `socket` | 2 | roles.controller.ts → socket.gateway.ts; roles.module.ts → socket.module.ts |
| `scripts` | `mikro-orm` | 1 | mark-migrations-executed.ts → mikro-orm.module.ts |
| `seeders` | `seeds` | 1 | DatabaseSeeder.ts → superadmin-bootstrap.runner.ts |
| `seeds` | `entities` | 4 | superadmin-bootstrap.runner.ts → user.entity.ts; superadmin-bootstrap.runner.ts → role.entity.ts; superadmin-bootstrap.runner.ts → user-role.entity.ts; superadmin-bootstrap.runner.ts → page-content.entity.ts |
| `sessions` | `common` | 3 | sessions.controller.ts → api-response.ts; sessions.service.ts → resolve-relation-filters.ts; sessions.service.ts → pagination.ts |
| `sessions` | `config` | 3 | sessions.controller.ts → constants.ts; sessions.controller.ts → permissions.ts; sessions.service.ts → constants.ts |
| `sessions` | `entities` | 5 | sessions.controller.ts → notification.entity.ts; sessions.service.ts → session.entity.ts; sessions.service.ts → user.entity.ts; sessions.service.ts → user-role.entity.ts |
| `sessions` | `notifications` | 2 | sessions.controller.ts → notifications.service.ts; sessions.module.ts → notifications.module.ts |
| `sessions` | `socket` | 2 | sessions.controller.ts → socket.gateway.ts; sessions.module.ts → socket.module.ts |
| `settings` | `common` | 1 | settings.controller.ts → api-response.ts |
| `settings` | `config` | 1 | settings.controller.ts → constants.ts |
| `settings` | `entities` | 1 | settings.service.ts → setting.entity.ts |
| `socket` | `config` | 1 | socket.gateway.ts → app.config.ts |
| `socket` | `entities` | 2 | socket.gateway.ts → notification.entity.ts; socket.gateway.ts → user.entity.ts |
| `socket` | `sessions` | 2 | socket.gateway.ts → sessions.service.ts; socket.module.ts → sessions.module.ts |
| `students` | `common` | 3 | students.controller.ts → api-response.ts; students.service.ts → pagination.ts; students.service.ts → get-options.ts |
| `students` | `config` | 2 | students.controller.ts → constants.ts; students.controller.ts → permissions.ts |
| `students` | `entities` | 3 | students.controller.ts → notification.entity.ts; students.service.ts → user.entity.ts; students.service.ts → student.entity.ts |
| `students` | `notifications` | 2 | students.controller.ts → notifications.service.ts; students.module.ts → notifications.module.ts |
| `system` | `auth` | 2 | system.controller.ts → auth.service.ts; system.module.ts → auth.module.ts |
| `system` | `common` | 1 | system.controller.ts → api-response.ts |
| `system` | `config` | 2 | system.controller.ts → constants.ts; system.controller.ts → permissions.ts |
| `system` | `entities` | 22 | system.service.ts → account.entity.ts; system.service.ts → admission-result.entity.ts; system.service.ts → category.entity.ts; system.service.ts → comment.entity.ts |
| `system` | `mikro-orm` | 1 | system.service.ts → orm-entities.ts |
| `system` | `seeds` | 1 | system.service.ts → superadmin-bootstrap.runner.ts |
| `tags` | `common` | 3 | tags.controller.ts → api-response.ts; tags.service.ts → pagination.ts; tags.service.ts → get-options.ts |
| `tags` | `config` | 2 | tags.controller.ts → constants.ts; tags.controller.ts → permissions.ts |
| `tags` | `entities` | 2 | tags.controller.ts → notification.entity.ts; tags.service.ts → tag.entity.ts |
| `tags` | `notifications` | 2 | tags.controller.ts → notifications.service.ts; tags.module.ts → notifications.module.ts |
| `uploads` | `common` | 1 | uploads.controller.ts → api-response.ts |
| `uploads` | `config` | 4 | public-uploads.controller.ts → constants.ts; uploads.controller.ts → app.config.ts; uploads.controller.ts → constants.ts; uploads.service.ts → app.config.ts |
| `users` | `common` | 4 | users.controller.ts → api-response.ts; users.service.ts → pagination.ts; users.service.ts → get-options.ts; users.service.ts → date-utils.ts |
| `users` | `config` | 2 | users.controller.ts → constants.ts; users.controller.ts → permissions.ts |
| `users` | `entities` | 4 | users.controller.ts → notification.entity.ts; users.service.ts → role.entity.ts; users.service.ts → user-role.entity.ts; users.service.ts → user.entity.ts |
| `users` | `notifications` | 2 | users.controller.ts → notifications.service.ts; users.module.ts → notifications.module.ts |
| `users` | `sessions` | 2 | users.controller.ts → sessions.service.ts; users.module.ts → sessions.module.ts |
| `users` | `socket` | 2 | users.controller.ts → socket.gateway.ts; users.module.ts → socket.module.ts |

## Domain trung tâm (chiều ngược: ai import vào domain này?)

Liệt kê domain **đích** (`to`) được nhiều cạnh `imports` nhất; kèm các domain **nguồn** (`from`) nổi bật.

- **`entities`**: **168** cạnh từ **25** domain — `_root` (26), `mikro-orm` (22), `system` (22), `common` (13), `dashboard` (12), `public` (9), `posts` (7), `groups` (6)
- **`common`**: **48** cạnh từ **22** domain — `posts` (5), `_root` (4), `users` (4), `admission-results` (3), `contact-requests` (3), `roles` (3), `sessions` (3), `students` (3)
- **`config`**: **47** cạnh từ **25** domain — `uploads` (4), `common` (3), `sessions` (3), `admission-results` (2), `auth` (2), `categories` (2), `comments` (2), `contact-requests` (2)
- **`notifications`**: **25** cạnh từ **13** domain — `admission-results` (2), `categories` (2), `comments` (2), `contact-requests` (2), `groups` (2), `page-contents` (2), `posts` (2), `roles` (2)
- **`socket`**: **12** cạnh từ **6** domain — `messages` (3), `groups` (2), `roles` (2), `sessions` (2), `users` (2), `_root` (1)
- **`auth`**: **7** cạnh từ **4** domain — `page-contents` (2), `public` (2), `system` (2), `_root` (1)
- **`sessions`**: **5** cạnh từ **3** domain — `socket` (2), `users` (2), `_root` (1)
- **`mikro-orm`**: **4** cạnh từ **3** domain — `_root` (2), `scripts` (1), `system` (1)
- **`users`**: **4** cạnh từ **2** domain — `public` (3), `_root` (1)
- **`admission-results`**: **3** cạnh từ **2** domain — `public` (2), `_root` (1)
- **`page-contents`**: **3** cạnh từ **2** domain — `public` (2), `_root` (1)
- **`seeds`**: **3** cạnh từ **3** domain — `_root` (1), `seeders` (1), `system` (1)
- **`system`**: **2** cạnh từ **1** domain — `_root` (2)
- **`accounts`**: **1** cạnh từ **1** domain — `_root` (1)
- **`categories`**: **1** cạnh từ **1** domain — `_root` (1)
- **`comments`**: **1** cạnh từ **1** domain — `_root` (1)
- **`contact-requests`**: **1** cạnh từ **1** domain — `_root` (1)
- **`dashboard`**: **1** cạnh từ **1** domain — `_root` (1)
- **`groups`**: **1** cạnh từ **1** domain — `_root` (1)
- **`messages`**: **1** cạnh từ **1** domain — `_root` (1)
- **`posts`**: **1** cạnh từ **1** domain — `_root` (1)
- **`proxy-image`**: **1** cạnh từ **1** domain — `_root` (1)
- **`public`**: **1** cạnh từ **1** domain — `_root` (1)
- **`roles`**: **1** cạnh từ **1** domain — `_root` (1)
- **`settings`**: **1** cạnh từ **1** domain — `_root` (1)
- **`students`**: **1** cạnh từ **1** domain — `_root` (1)
- **`tags`**: **1** cạnh từ **1** domain — `_root` (1)
- **`uploads`**: **1** cạnh từ **1** domain — `_root` (1)

## Sơ đồ Mermaid (tối đa 80 cặp domain, ưu tiên cạnh có trọng số lớn)

```mermaid
flowchart LR
    dom_root["_root"]
    dom_accounts["accounts"]
    dom_admission_results["admission-results"]
    dom_auth["auth"]
    dom_categories["categories"]
    dom_comments["comments"]
    dom_common["common"]
    dom_config["config"]
    dom_contact_requests["contact-requests"]
    dom_dashboard["dashboard"]
    dom_entities["entities"]
    dom_groups["groups"]
    dom_messages["messages"]
    dom_mikro_orm["mikro-orm"]
    dom_notifications["notifications"]
    dom_page_contents["page-contents"]
    dom_posts["posts"]
    dom_public["public"]
    dom_roles["roles"]
    dom_seeds["seeds"]
    dom_sessions["sessions"]
    dom_socket["socket"]
    dom_students["students"]
    dom_system["system"]
    dom_tags["tags"]
    dom_uploads["uploads"]
    dom_users["users"]
    dom_root -->|26| dom_entities
    dom_mikro_orm -->|22| dom_entities
    dom_system -->|22| dom_entities
    dom_common -->|13| dom_entities
    dom_dashboard -->|12| dom_entities
    dom_public -->|9| dom_entities
    dom_posts -->|7| dom_entities
    dom_groups -->|6| dom_entities
    dom_messages -->|6| dom_entities
    dom_notifications -->|5| dom_entities
    dom_posts -->|5| dom_common
    dom_sessions -->|5| dom_entities
    dom_root -->|4| dom_common
    dom_seeds -->|4| dom_entities
    dom_uploads -->|4| dom_config
    dom_users -->|4| dom_common
    dom_users -->|4| dom_entities
    dom_admission_results -->|3| dom_common
    dom_auth -->|3| dom_entities
    dom_categories -->|3| dom_entities
    dom_common -->|3| dom_config
    dom_contact_requests -->|3| dom_common
    dom_contact_requests -->|3| dom_entities
    dom_messages -->|3| dom_socket
    dom_public -->|3| dom_users
    dom_roles -->|3| dom_common
    dom_sessions -->|3| dom_common
    dom_sessions -->|3| dom_config
    dom_students -->|3| dom_common
    dom_students -->|3| dom_entities
    dom_tags -->|3| dom_common
    dom_root -->|2| dom_mikro_orm
    dom_root -->|2| dom_system
    dom_accounts -->|2| dom_entities
    dom_admission_results -->|2| dom_config
    dom_admission_results -->|2| dom_entities
    dom_admission_results -->|2| dom_notifications
    dom_auth -->|2| dom_config
    dom_categories -->|2| dom_common
    dom_categories -->|2| dom_config
    dom_categories -->|2| dom_notifications
    dom_comments -->|2| dom_common
    dom_comments -->|2| dom_config
    dom_comments -->|2| dom_entities
    dom_comments -->|2| dom_notifications
    dom_contact_requests -->|2| dom_config
    dom_contact_requests -->|2| dom_notifications
    dom_groups -->|2| dom_config
    dom_groups -->|2| dom_notifications
    dom_groups -->|2| dom_socket
    dom_messages -->|2| dom_common
    dom_messages -->|2| dom_config
    dom_page_contents -->|2| dom_auth
    dom_page_contents -->|2| dom_config
    dom_page_contents -->|2| dom_entities
    dom_page_contents -->|2| dom_notifications
    dom_posts -->|2| dom_config
    dom_posts -->|2| dom_notifications
    dom_public -->|2| dom_admission_results
    dom_public -->|2| dom_auth
    dom_public -->|2| dom_common
    dom_public -->|2| dom_config
    dom_public -->|2| dom_page_contents
    dom_roles -->|2| dom_config
    dom_roles -->|2| dom_entities
    dom_roles -->|2| dom_notifications
    dom_roles -->|2| dom_socket
    dom_sessions -->|2| dom_notifications
    dom_sessions -->|2| dom_socket
    dom_socket -->|2| dom_entities
    dom_socket -->|2| dom_sessions
    dom_students -->|2| dom_config
    dom_students -->|2| dom_notifications
    dom_system -->|2| dom_auth
    dom_system -->|2| dom_config
    dom_tags -->|2| dom_config
    dom_tags -->|2| dom_entities
    dom_tags -->|2| dom_notifications
    dom_users -->|2| dom_config
    dom_users -->|2| dom_notifications
```

## Ghi chú

- Chỉ liệt kê import **nội bộ** giữa file dưới `src/` (theo snapshot Graphify). Import package npm có thể không xuất hiện.
- Để biết **HTTP route** giữa client và API, xem controller + `SUMMARY_FOR_AI.md` (module map).

## Làm mới

Chạy `node apps/api/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
