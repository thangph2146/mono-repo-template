# REST API — @api (NestJS) — tóm tắt cho AI (Graphify)

> Tự động sinh từ `../snapshot/context.json` — **đọc file này trước**; tránh mở toàn bộ JSON snapshot (nhúng source đầy đủ).

- **projectRoot:** `C:/HUB/source/hub-parent-template/apps/api`
- **context.generatedAt:** 2026-05-19T08:42:48.929Z

## Mục lục artefact Graphify

- **Markdown (ưu tiên đọc):** file này — [`FOLDER_TREE.md`](FOLDER_TREE.md), [`GRAPH_STATS.md`](GRAPH_STATS.md) — [`API_DOMAIN_IMPORTS.md`](API_DOMAIN_IMPORTS.md)
- **Snapshot (JSON nặng):** [`../snapshot/context.json`](../snapshot/context.json), [`../snapshot/graph.json`](../snapshot/graph.json) — chỉ mở khi cần trích source hoặc đồ thị đầy đủ.
- **Quy ước thư mục `.graphify` (tay):** [`../README.md`](../README.md).

## Liên kết dịch vụ & tài liệu hub

App **không** import chéo source `apps/*`; giao tiếp qua **HTTP** + `@workspace/api-client` (và `fetch` public ở storefront khi cần).

### Graphify — markdown các phần còn lại của monorepo

- **@frontend:** [SUMMARY](../../../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/frontend/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/frontend/.graphify/markdown/GRAPH_STATS.md)
- **@backend:** [SUMMARY](../../../../apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/backend/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/backend/.graphify/markdown/GRAPH_STATS.md)
- **packages:** [SUMMARY](../../../../packages/.graphify/markdown/SUMMARY_FOR_AI.md) · [WORKSPACE_DEPS](../../../../packages/.graphify/markdown/WORKSPACE_DEPS.md)
- **monorepo (chỉ mục + chủ đề):** [SUMMARY gốc](../../../../.graphify/markdown/SUMMARY_FOR_AI.md)

### Tài liệu hub (không sinh bởi Graphify)

- [MICROSERVICE_SYSTEM_MAP](../../../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md) — boundaries, ORM, checklist.
- [AGENTS_GUIDE](../../../../docs/hub-parent/AGENTS_GUIDE.md) — thứ tự đọc cho agent.
- [AGENTS.md](../../../../AGENTS.md) — `pnpm check`, `check:full`.

## Bản đồ từ snapshot/graph.json

- **Cây thư mục `src/`:** [`FOLDER_TREE.md`](FOLDER_TREE.md) (ASCII từ `../snapshot/graph.json`).
- **Thống kê graph:** [`GRAPH_STATS.md`](GRAPH_STATS.md) — quy mô node/link, top file in/out-degree (điểm nóng import).
- **Phụ thuộc chéo giữa domain API:** [`API_DOMAIN_IMPORTS.md`](API_DOMAIN_IMPORTS.md) — domain `src/<tên>` nào import domain nào (cạnh `imports` trong graph).

## Thống kê
- **totalFiles:** 131
- **clientComponents:** 0

## Góc hệ thống (@api) — đường dẫn gợi ý

### Cấu hình runtime (`src/config/`)
- `src/config/app.config.ts`
- `src/config/constants.ts`
- `src/config/permissions.ts`

### Seeds / bootstrap
- `src/seeds/superadmin-bootstrap.data.ts`
- `src/seeds/superadmin-bootstrap.runner.ts`

> **DB:** entity `src/entities/`, migration `src/migrations/` — xem thêm bảng *Module map* và `docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md` (MikroORM).

## Nest — module (26)
- `src/accounts/accounts.module.ts`
- `src/admission-results/admission-results.module.ts`
- `src/app.module.ts`
- `src/auth/auth.module.ts`
- `src/categories/categories.module.ts`
- `src/comments/comments.module.ts`
- `src/contact-requests/contact-requests.module.ts`
- `src/dashboard/dashboard.module.ts`
- `src/groups/groups.module.ts`
- `src/messages/messages.module.ts`
- `src/mikro-orm/mikro-orm.module.ts`
- `src/notifications/notifications.module.ts`
- `src/page-contents/page-contents.module.ts`
- `src/parent-students/parent-students.module.ts`
- `src/posts/posts.module.ts`
- `src/proxy-image/proxy-image.module.ts`
- `src/public/public.module.ts`
- `src/roles/roles.module.ts`
- `src/sessions/sessions.module.ts`
- `src/settings/settings.module.ts`
- `src/socket/socket.module.ts`
- `src/students/students.module.ts`
- `src/system/system.module.ts`
- `src/tags/tags.module.ts`
- `src/uploads/uploads.module.ts`
- `src/users/users.module.ts`

## Nest — controller (25)
- `src/accounts/accounts.controller.ts`
- `src/admission-results/admission-results.controller.ts`
- `src/auth/auth-admin.controller.ts`
- `src/categories/categories.controller.ts`
- `src/comments/comments.controller.ts`
- `src/contact-requests/contact-requests.controller.ts`
- `src/dashboard/dashboard.controller.ts`
- `src/groups/groups.controller.ts`
- `src/messages/conversations.controller.ts`
- `src/messages/messages.controller.ts`
- `src/notifications/notifications.controller.ts`
- `src/page-contents/page-contents.controller.ts`
- `src/parent-students/parent-students.controller.ts`
- `src/posts/posts.controller.ts`
- `src/proxy-image/proxy-image.controller.ts`
- `src/public/public.controller.ts`
- `src/roles/roles.controller.ts`
- `src/sessions/sessions.controller.ts`
- `src/settings/settings.controller.ts`
- `src/students/students.controller.ts`
- `src/system/system.controller.ts`
- `src/tags/tags.controller.ts`
- `src/uploads/public-uploads.controller.ts`
- `src/uploads/uploads.controller.ts`
- `src/users/users.controller.ts`

## Entities (24)
- `src/entities/account.entity.ts`
- `src/entities/admission-result.entity.ts`
- `src/entities/base.entity.ts`
- `src/entities/category.entity.ts`
- `src/entities/comment.entity.ts`
- `src/entities/contact-request.entity.ts`
- `src/entities/group-member.entity.ts`
- `src/entities/group.entity.ts`
- `src/entities/message-read.entity.ts`
- `src/entities/message.entity.ts`
- `src/entities/notification.entity.ts`
- `src/entities/page-content.entity.ts`
- `src/entities/parent-student.entity.ts`
- `src/entities/post-category.entity.ts`
- `src/entities/post-tag.entity.ts`
- `src/entities/post.entity.ts`
- `src/entities/role.entity.ts`
- `src/entities/session.entity.ts`
- `src/entities/setting.entity.ts`
- `src/entities/student.entity.ts`
- `src/entities/tag.entity.ts`
- `src/entities/user-role.entity.ts`
- `src/entities/user.entity.ts`
- `src/entities/verification-token.entity.ts`

## Migrations (6)
- `src/migrations/Migration20260503140000.ts`
- `src/migrations/Migration20260503150000.ts`
- `src/migrations/Migration20260503160000.ts`
- `src/migrations/Migration20260503170000.ts`
- `src/migrations/Migration20260503180000.ts`
- `src/migrations/Migration20260514100000.ts`

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `package.json` | config | — | — | — |
| `src/accounts/accounts.controller.ts` | ts | no | AccountsController | src/accounts/accounts.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/accounts/accounts.module.ts` | ts | no | AccountsModule | src/accounts/accounts.controller.ts, src/accounts/accounts.service.ts |
| `src/accounts/accounts.service.ts` | ts | no | AccountProfileDto, UpdateAccountDto, AccountsService | src/entities/user.entity.ts, src/entities/user-role.entity.ts |
| `src/admission-results/admission-results.controller.ts` | ts | no | AdmissionResultsController | src/admission-results/admission-results.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/per |
| `src/admission-results/admission-results.module.ts` | ts | no | AdmissionResultsModule | src/notifications/notifications.module.ts, src/admission-results/admission-results.service.ts, src/admission-results/admission-results.controller.ts |
| `src/admission-results/admission-results.service.ts` | ts | no | AdmissionResultRowDto, ListAdmissionResultsParams, ListAdmissionResultsResult, AdmissionResultsService | src/entities/admission-result.entity.ts, src/common/pagination.ts, src/common/date-utils.ts |
| `src/app.module.ts` | ts | no | AppModule | src/mikro-orm/mikro-orm.module.ts, src/public/public.module.ts, src/socket/socket.module.ts, src/auth/auth.module.ts, src/notifications/notifications.module.ts, src/accounts/accounts.module.ts, src/se |
| `src/auth/auth-admin.controller.ts` | ts | no | AuthAdminController | src/auth/auth.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/auth/auth.module.ts` | ts | no | AuthModule | src/auth/auth-admin.controller.ts, src/auth/auth.service.ts |
| `src/auth/auth.service.ts` | ts | no | LoginDto, GoogleProfileDto, AuthUserPayload, AuthService | src/config/constants.ts, src/entities/user.entity.ts, src/entities/role.entity.ts, src/entities/user-role.entity.ts |
| `src/categories/categories.controller.ts` | ts | no | CategoriesController | src/categories/categories.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/categories/categories.module.ts` | ts | no | CategoriesModule | src/notifications/notifications.module.ts, src/categories/categories.service.ts, src/categories/categories.controller.ts |
| `src/categories/categories.service.ts` | ts | no | CategoryRowDto, ChildCategoryDto, RelatedPostDto, ListCategoriesParams, ListCategoriesResult, CategoriesService | src/common/pagination.ts, src/entities/category.entity.ts, src/entities/post-category.entity.ts |
| `src/comments/comments.controller.ts` | ts | no | CommentsController | src/comments/comments.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/comments/comments.module.ts` | ts | no | CommentsModule | src/notifications/notifications.module.ts, src/comments/comments.service.ts, src/comments/comments.controller.ts |
| `src/comments/comments.service.ts` | ts | no | CommentRowDto, ListCommentsParams, ListCommentsResult, CommentsService | src/common/pagination.ts, src/entities/comment.entity.ts |
| `src/common/api-access.middleware.ts` | ts | no | ApiAccessMiddleware | src/config/constants.ts, src/common/request-id.middleware.ts |
| `src/common/api-response.ts` | ts | no | ApiResponsePayload, createSuccessResponse, createErrorResponse |  |
| `src/common/database-http-exception.filter.ts` | ts | no | DatabaseHttpExceptionFilter | src/common/api-response.ts |
| `src/common/date-utils.ts` | ts | no | safeIsoString, safeIsoStringNow |  |
| `src/common/get-options.ts` | ts | no | GetOptionsColumnConfig, GetOptionsConfig |  |
| `src/common/logging.interceptor.ts` | ts | no | LoggingInterceptor | src/config/app.config.ts, src/config/constants.ts, src/common/request-id.middleware.ts |
| `src/common/pagination.ts` | ts | no | PaginationParams, normalizePageLimit, PaginationMeta, paginationMeta |  |
| `src/common/request-id.middleware.ts` | ts | no | REQUEST_ID_HEADER, RequestIdMiddleware |  |
| `src/common/resolve-relation-filters.ts` | ts | no | RelationFilterConfig, RelationFiltersConfig | src/entities/admission-result.entity.ts, src/entities/category.entity.ts, src/entities/contact-request.entity.ts, src/entities/group.entity.ts, src/entities/message.entity.ts, src/entities/notificatio |
| `src/config/app.config.ts` | ts | no | appConfig | src/config/constants.ts |
| `src/config/constants.ts` | ts | no | APP_HEADERS, AUTH_ROLE_NAMES, AuthRoleName, ADMIN_ROUTES, PUBLIC_ROUTES |  |
| `src/config/permissions.ts` | ts | no | RESOURCES, ACTIONS, Resource, Action, Permission, PERMISSIONS |  |
| `src/contact-requests/contact-requests.controller.ts` | ts | no | ContactRequestsController | src/contact-requests/contact-requests.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permi |
| `src/contact-requests/contact-requests.module.ts` | ts | no | ContactRequestsModule | src/notifications/notifications.module.ts, src/contact-requests/contact-requests.service.ts, src/contact-requests/contact-requests.controller.ts |
| `src/contact-requests/contact-requests.service.ts` | ts | no | ContactStatus, ContactPriority, ContactRequestRowDto, ListContactRequestsParams, ListContactRequestsResult, ContactRequestsService | src/entities/contact-request.entity.ts, src/entities/user.entity.ts, src/common/pagination.ts, src/common/date-utils.ts |
| `src/dashboard/dashboard.controller.ts` | ts | no | DashboardController | src/dashboard/dashboard.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/dashboard/dashboard.module.ts` | ts | no | DashboardModule | src/dashboard/dashboard.controller.ts, src/dashboard/dashboard.service.ts |
| `src/dashboard/dashboard.service.ts` | ts | no | DashboardOverviewDto, DashboardMonthlyItemDto, DashboardCategoryItemDto, DashboardTopPostDto, DashboardStatsDto, DashboardService | src/entities/category.entity.ts, src/entities/comment.entity.ts, src/entities/contact-request.entity.ts, src/entities/message.entity.ts, src/entities/notification.entity.ts, src/entities/post-category |
| `src/entities/account.entity.ts` | ts | no | Account | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/admission-result.entity.ts` | ts | no | AdmissionResult | src/entities/base.entity.ts |
| `src/entities/base.entity.ts` | ts | no |  |  |
| `src/entities/category.entity.ts` | ts | no | Category | src/entities/base.entity.ts, src/entities/post-category.entity.ts |
| `src/entities/comment.entity.ts` | ts | no | Comment | src/entities/base.entity.ts, src/entities/post.entity.ts, src/entities/user.entity.ts |
| `src/entities/contact-request.entity.ts` | ts | no | ContactStatus, ContactPriority, ContactRequest | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/group-member.entity.ts` | ts | no | GroupRole, GroupMember | src/entities/base.entity.ts, src/entities/group.entity.ts, src/entities/user.entity.ts |
| `src/entities/group.entity.ts` | ts | no | Group | src/entities/base.entity.ts, src/entities/group-member.entity.ts, src/entities/message.entity.ts, src/entities/user.entity.ts |
| `src/entities/message-read.entity.ts` | ts | no | MessageRead | src/entities/base.entity.ts, src/entities/message.entity.ts, src/entities/user.entity.ts |
| `src/entities/message.entity.ts` | ts | no | MessageType, Message | src/entities/base.entity.ts, src/entities/group.entity.ts, src/entities/message-read.entity.ts, src/entities/user.entity.ts |
| `src/entities/notification.entity.ts` | ts | no | NotificationKind, Notification | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/page-content.entity.ts` | ts | no | PageContent | src/entities/base.entity.ts |
| `src/entities/parent-student.entity.ts` | ts | no | ParentStudentStatus, ParentStudent | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/post-category.entity.ts` | ts | no | PostCategory | src/entities/post.entity.ts, src/entities/category.entity.ts |
| `src/entities/post-tag.entity.ts` | ts | no | PostTag | src/entities/post.entity.ts, src/entities/tag.entity.ts |
| `src/entities/post.entity.ts` | ts | no | Post | src/entities/base.entity.ts, src/entities/comment.entity.ts, src/entities/post-category.entity.ts, src/entities/post-tag.entity.ts, src/entities/user.entity.ts |
| `src/entities/role.entity.ts` | ts | no | Role | src/entities/base.entity.ts, src/entities/user-role.entity.ts |
| `src/entities/session.entity.ts` | ts | no | Session | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/setting.entity.ts` | ts | no | Setting | src/entities/base.entity.ts |
| `src/entities/student.entity.ts` | ts | no | Student | src/entities/base.entity.ts, src/entities/user.entity.ts |
| `src/entities/tag.entity.ts` | ts | no | Tag | src/entities/base.entity.ts, src/entities/post-tag.entity.ts |
| `src/entities/user-role.entity.ts` | ts | no | UserRole | src/entities/base.entity.ts, src/entities/role.entity.ts, src/entities/user.entity.ts |
| `src/entities/user.entity.ts` | ts | no | User | src/entities/base.entity.ts, src/entities/account.entity.ts, src/entities/comment.entity.ts, src/entities/contact-request.entity.ts, src/entities/group-member.entity.ts, src/entities/group.entity.ts,  |
| `src/entities/verification-token.entity.ts` | ts | no | VerificationToken |  |
| `src/groups/groups.controller.ts` | ts | no | GroupsController | src/groups/groups.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/socket/socket.gateway.ts, src/common/api-response.ts, src/config/constants.ts, src/co |
| `src/groups/groups.module.ts` | ts | no | GroupsModule | src/notifications/notifications.module.ts, src/socket/socket.module.ts, src/groups/groups.controller.ts, src/groups/groups.service.ts |
| `src/groups/groups.service.ts` | ts | no | CreateGroupInput, ListGroupsInput, GroupsService | src/entities/group.entity.ts, src/entities/group-member.entity.ts, src/entities/message.entity.ts, src/entities/message-read.entity.ts, src/entities/user.entity.ts |
| `src/main.ts` | ts | no |  | src/app.module.ts, src/common/logging.interceptor.ts, src/config/app.config.ts, src/common/database-http-exception.filter.ts, src/common/request-id.middleware.ts, src/common/api-access.middleware.ts |
| `src/messages/conversations.controller.ts` | ts | no | ConversationsController | src/common/api-response.ts, src/socket/socket.gateway.ts, src/entities/message.entity.ts, src/config/constants.ts |
| `src/messages/messages.controller.ts` | ts | no | MessagesController | src/socket/socket.gateway.ts, src/common/api-response.ts, src/entities/message.entity.ts, src/entities/message-read.entity.ts, src/entities/group-member.entity.ts, src/entities/group.entity.ts, src/en |
| `src/messages/messages.module.ts` | ts | no | MessagesModule | src/socket/socket.module.ts, src/messages/messages.controller.ts, src/messages/conversations.controller.ts |
| `src/migrations/Migration20260503140000.ts` | ts | no | Migration20260503140000 |  |
| `src/migrations/Migration20260503150000.ts` | ts | no | Migration20260503150000 |  |
| `src/migrations/Migration20260503160000.ts` | ts | no | Migration20260503160000 |  |
| `src/migrations/Migration20260503170000.ts` | ts | no | Migration20260503170000 |  |
| `src/migrations/Migration20260503180000.ts` | ts | no | Migration20260503180000 |  |
| `src/migrations/Migration20260514100000.ts` | ts | no | Migration20260514100000 |  |
| `src/mikro-orm/mikro-orm.module.ts` | ts | no | createMikroConfig, DatabaseModule | src/mikro-orm/orm-entities.ts |
| `src/mikro-orm/orm-entities.ts` | ts | no | ormEntities | src/entities/account.entity.ts, src/entities/admission-result.entity.ts, src/entities/category.entity.ts, src/entities/comment.entity.ts, src/entities/contact-request.entity.ts, src/entities/group.ent |
| `src/notifications/notifications.controller.ts` | ts | no | NotificationsController | src/notifications/notifications.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/notifications/notifications.module.ts` | ts | no | NotificationsModule | src/notifications/notifications.service.ts, src/notifications/notifications.controller.ts |
| `src/notifications/notifications.service.ts` | ts | no | NotificationsListQuery, NotificationItemDto, NotificationsListResult, UnreadCountsResult, AdminTableRowDto, AdminTableQuery, AdminTableResult, NotificationsService | src/entities/notification.entity.ts, src/entities/user.entity.ts, src/entities/user-role.entity.ts, src/entities/message.entity.ts, src/entities/contact-request.entity.ts |
| `src/page-contents/page-contents.controller.ts` | ts | no | PageContentsController | src/page-contents/page-contents.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/auth/auth.service.ts, src/common/api-response.ts, src/config/constants. |
| `src/page-contents/page-contents.module.ts` | ts | no | PageContentsModule | src/page-contents/page-contents.service.ts, src/page-contents/page-contents.controller.ts, src/notifications/notifications.module.ts, src/auth/auth.module.ts |
| `src/page-contents/page-contents.service.ts` | ts | no | PageContentCreateInput, PageContentUpdateInput, PageContentsService | src/entities/page-content.entity.ts |
| `src/parent-students/parent-students.controller.ts` | ts | no | ParentStudentsPublicController, ParentStudentsAdminController | src/parent-students/parent-students.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/parent-students/parent-students.module.ts` | ts | no | ParentStudentsModule | src/parent-students/parent-students.service.ts, src/parent-students/parent-students.controller.ts |
| `src/parent-students/parent-students.service.ts` | ts | no | ParentStudentRowDto, ParentStudentsService | src/entities/parent-student.entity.ts, src/common/pagination.ts |
| `src/posts/posts.controller.ts` | ts | no | PostsController | src/posts/posts.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/posts/posts.module.ts` | ts | no | PostsModule | src/notifications/notifications.module.ts, src/posts/posts.service.ts, src/posts/posts.controller.ts |
| `src/posts/posts.service.ts` | ts | no | PostRowDto, PostDetailDto, POSTS_FILTER_CATEGORIES_NONE, ListPostsParams, ListPostsResult, PostsService | src/common/resolve-relation-filters.ts, src/common/pagination.ts, src/common/get-options.ts, src/common/date-utils.ts, src/entities/post.entity.ts, src/entities/post-category.entity.ts, src/entities/p |
| `src/proxy-image/proxy-image.controller.ts` | ts | no | ProxyImageController | src/config/constants.ts |
| `src/proxy-image/proxy-image.module.ts` | ts | no | ProxyImageModule | src/proxy-image/proxy-image.controller.ts |
| `src/public/public-auth.service.ts` | ts | no | CreatePublicRegisterDto, PublicAuthService | src/entities/role.entity.ts, src/entities/user.entity.ts, src/auth/auth.service.ts, src/users/users.service.ts, src/config/constants.ts |
| `src/public/public-categories.service.ts` | ts | no | PublicCategoryItem, PublicCategoriesService | src/entities/category.entity.ts, src/entities/post-category.entity.ts |
| `src/public/public-contact-requests.service.ts` | ts | no | CreateContactRequestDto, PublicContactRequestsService | src/entities/contact-request.entity.ts |
| `src/public/public-posts.service.ts` | ts | no | PublicPostsQuery, PublicPostsService | src/entities/post.entity.ts, src/entities/category.entity.ts, src/entities/tag.entity.ts, src/entities/setting.entity.ts, src/common/pagination.ts |
| `src/public/public.controller.ts` | ts | no | PublicController | src/public/public-posts.service.ts, src/public/public-categories.service.ts, src/public/public-contact-requests.service.ts, src/public/public-auth.service.ts, src/admission-results/admission-results.s |
| `src/public/public.module.ts` | ts | no | PublicModule | src/public/public.controller.ts, src/public/public-posts.service.ts, src/public/public-categories.service.ts, src/public/public-contact-requests.service.ts, src/public/public-auth.service.ts, src/admi |
| `src/roles/roles.controller.ts` | ts | no | RolesController | src/roles/roles.service.ts, src/socket/socket.gateway.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/conf |
| `src/roles/roles.module.ts` | ts | no | RolesModule | src/notifications/notifications.module.ts, src/socket/socket.module.ts, src/roles/roles.controller.ts, src/roles/roles.service.ts |
| `src/roles/roles.service.ts` | ts | no | RoleRowDto, ListRolesParams, ListRolesResult, RolesService | src/common/pagination.ts, src/common/get-options.ts, src/entities/role.entity.ts |
| `src/scripts/mark-migrations-executed.ts` | ts | no |  | src/mikro-orm/mikro-orm.module.ts |
| `src/seed-full-export.ts` | ts | no |  | src/mikro-orm/orm-entities.ts, src/entities/account.entity.ts, src/entities/admission-result.entity.ts, src/entities/category.entity.ts, src/entities/comment.entity.ts, src/entities/contact-request.en |
| `src/seed-guides.ts` | ts | no |  | src/entities/page-content.entity.ts |
| `src/seed-superadmin.ts` | ts | no |  | src/entities/user.entity.ts, src/entities/role.entity.ts, src/entities/user-role.entity.ts, src/entities/page-content.entity.ts, src/seeds/superadmin-bootstrap.runner.ts |
| `src/seeders/DatabaseSeeder.ts` | ts | no | DatabaseSeeder | src/seeds/superadmin-bootstrap.runner.ts |
| `src/seeds/superadmin-bootstrap.data.ts` | ts | no | SUPERADMIN_ROLES_DATA, SUPERADMIN_USERS_DATA, SUPERADMIN_USER_ROLES_DATA |  |
| `src/seeds/superadmin-bootstrap.runner.ts` | ts | no | SuperadminBootstrapResult | src/entities/user.entity.ts, src/entities/role.entity.ts, src/entities/user-role.entity.ts, src/entities/page-content.entity.ts, src/seeds/superadmin-bootstrap.data.ts |
| `src/sessions/sessions.controller.ts` | ts | no | SessionsController | src/sessions/sessions.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/socket/socket.gateway.ts, src/common/api-response.ts, src/config/constants.ts, sr |
| `src/sessions/sessions.module.ts` | ts | no | SessionsModule | src/notifications/notifications.module.ts, src/socket/socket.module.ts, src/sessions/sessions.service.ts, src/sessions/sessions.controller.ts |
| `src/sessions/sessions.service.ts` | ts | no | SessionRowDto, ListSessionsParams, ListSessionsResult, AccountWithSessionStatusDto, ListAccountsWithSessionStatusParams, ListAccountsWithSessionStatusResult, SessionsService | src/entities/session.entity.ts, src/entities/user.entity.ts, src/entities/user-role.entity.ts, src/entities/role.entity.ts, src/common/resolve-relation-filters.ts, src/common/pagination.ts, src/config |
| `src/settings/settings.controller.ts` | ts | no | SettingsController | src/settings/settings.service.ts, src/common/api-response.ts, src/config/constants.ts |
| `src/settings/settings.module.ts` | ts | no | SettingsModule | src/settings/settings.controller.ts, src/settings/settings.service.ts |
| `src/settings/settings.service.ts` | ts | no | SettingsService | src/entities/setting.entity.ts |
| `src/socket/notification-mapper.ts` | ts | no | NotificationLike, mapNotificationToPayload | src/socket/socket.types.ts |
| `src/socket/socket.gateway.ts` | ts | no | SocketGateway | src/sessions/sessions.service.ts, src/entities/notification.entity.ts, src/entities/user.entity.ts, src/socket/socket.types.ts, src/config/app.config.ts, src/socket/notification-mapper.ts |
| `src/socket/socket.module.ts` | ts | no | SocketModule | src/socket/socket.gateway.ts, src/sessions/sessions.module.ts |
| `src/socket/socket.types.ts` | ts | no | SocketNotificationKind, SocketNotificationPayload, SocketData, SessionRowDto, MAX_HTTP_BUFFER_SIZE, SOCKET_PATH, userRoom, conversationRoom, sessionRoom, roleRoom |  |
| `src/students/students.controller.ts` | ts | no | StudentsController | src/students/students.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/students/students.module.ts` | ts | no | StudentsModule | src/notifications/notifications.module.ts, src/students/students.controller.ts, src/students/students.service.ts |
| `src/students/students.service.ts` | ts | no | StudentRowDto, ListStudentsParams, ListStudentsResult, StudentsService | src/entities/user.entity.ts, src/common/pagination.ts, src/common/get-options.ts, src/entities/student.entity.ts |
| `src/system/import-helpers.ts` | ts | no | ImportRow, stripLegacyHeroSlideFromBundle, stripHeroSlidesPermissions, sanitizePivotRowsInExportJson, orderCategoryRowsForImport |  |
| `src/system/system.controller.ts` | ts | no | SystemController | src/system/system.service.ts, src/auth/auth.service.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/system/system.module.ts` | ts | no | SystemModule | src/system/system.controller.ts, src/system/system.service.ts, src/auth/auth.module.ts |
| `src/tags/tags.controller.ts` | ts | no | TagsController | src/tags/tags.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/common/api-response.ts, src/config/constants.ts, src/config/permissions.ts |
| `src/tags/tags.module.ts` | ts | no | TagsModule | src/notifications/notifications.module.ts, src/tags/tags.controller.ts, src/tags/tags.service.ts |
| `src/tags/tags.service.ts` | ts | no | RelatedPostDto, TagDetailDto, TagRowDto, ListTagsParams, ListTagsResult, TagsService | src/entities/tag.entity.ts, src/entities/post-tag.entity.ts, src/common/pagination.ts, src/common/get-options.ts |
| `src/uploads/public-uploads.controller.ts` | ts | no | PublicUploadsController | src/uploads/uploads.service.ts, src/config/constants.ts |
| `src/uploads/uploads.controller.ts` | ts | no | UploadsController | src/uploads/uploads.service.ts, src/common/api-response.ts, src/config/app.config.ts, src/config/constants.ts |
| `src/uploads/uploads.module.ts` | ts | no | UploadsModule | src/uploads/uploads.service.ts, src/uploads/uploads.controller.ts, src/uploads/public-uploads.controller.ts |
| `src/uploads/uploads.service.ts` | ts | no | ImageItemDto, FolderNodeDto, FolderItemDto, ListImagesResult, ListFoldersResult, UploadsService | src/config/app.config.ts |
| `src/users/users.controller.ts` | ts | no | UsersController | src/users/users.service.ts, src/notifications/notifications.service.ts, src/entities/notification.entity.ts, src/sessions/sessions.service.ts, src/socket/socket.gateway.ts, src/common/api-response.ts, |
| `src/users/users.module.ts` | ts | no | UsersModule | src/notifications/notifications.module.ts, src/socket/socket.module.ts, src/sessions/sessions.module.ts, src/users/users.service.ts, src/users/users.controller.ts |
| `src/users/users.service.ts` | ts | no | UserRowDto, DevLoginOptionDto, ListUsersParams, ListUsersResult, UsersService | src/common/pagination.ts, src/common/get-options.ts, src/common/date-utils.ts, src/entities/role.entity.ts, src/entities/user-role.entity.ts, src/entities/user.entity.ts |
| `tsconfig.json` | config | — | — | — |
## File Markdown trong scope app

Toàn bộ `.md` sinh tự động nằm trong **`apps/api/.graphify/markdown/`**; JSON trong **`../snapshot/`** — xem mục **Mục lục artefact Graphify** ở đầu file.

- **Chỉ mục monorepo + chủ đề:** [`../../../../.graphify/markdown/SUMMARY_FOR_AI.md`](../../../../.graphify/markdown/SUMMARY_FOR_AI.md).

## Làm mới

- Cập nhật `snapshot/context.json` **và** `snapshot/graph.json`: `node apps/api/.graphify/update.cjs`.
- Sau đó chạy: `pnpm graphify:ai-summary` (sinh thêm `FOLDER_TREE.md`, `GRAPH_STATS.md`, `API_DOMAIN_IMPORTS.md` khi có graph).
