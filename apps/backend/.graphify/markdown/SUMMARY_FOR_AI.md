# Hub admin — @backend — tóm tắt cho AI (Graphify)

> Tự động sinh từ `../snapshot/context.json` — **đọc file này trước**; tránh mở toàn bộ JSON snapshot (nhúng source đầy đủ).

- **projectRoot:** `D:/HUB/working/2026/hub-parrent-template/apps/backend`
- **context.generatedAt:** 2026-05-14T07:52:06.356Z

## Mục lục artefact Graphify

- **Markdown (ưu tiên đọc):** file này — [`FOLDER_TREE.md`](FOLDER_TREE.md), [`GRAPH_STATS.md`](GRAPH_STATS.md)
- **Snapshot (JSON nặng):** [`../snapshot/context.json`](../snapshot/context.json), [`../snapshot/graph.json`](../snapshot/graph.json) — chỉ mở khi cần trích source hoặc đồ thị đầy đủ.
- **Quy ước thư mục `.graphify` (tay):** [`../README.md`](../README.md).

## Liên kết dịch vụ & tài liệu hub

App **không** import chéo source `apps/*`; giao tiếp qua **HTTP** + `@workspace/api-client` (và `fetch` public ở storefront khi cần).

### Graphify — markdown các phần còn lại của monorepo

- **@frontend:** [SUMMARY](../../../../apps/frontend/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/frontend/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/frontend/.graphify/markdown/GRAPH_STATS.md)
- **@api:** [SUMMARY](../../../../apps/api/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/api/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/api/.graphify/markdown/GRAPH_STATS.md)
- **packages:** [SUMMARY](../../../../packages/.graphify/markdown/SUMMARY_FOR_AI.md) · [WORKSPACE_DEPS](../../../../packages/.graphify/markdown/WORKSPACE_DEPS.md)
- **monorepo (chỉ mục + chủ đề):** [SUMMARY gốc](../../../../.graphify/markdown/SUMMARY_FOR_AI.md)

### Tài liệu hub (không sinh bởi Graphify)

- [MICROSERVICE_SYSTEM_MAP](../../../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md) — boundaries, ORM, checklist.
- [AGENTS_GUIDE](../../../../docs/hub-parent/AGENTS_GUIDE.md) — thứ tự đọc cho agent.
- [AGENTS.md](../../../../AGENTS.md) — `pnpm check`, `check:full`.

## Bản đồ từ snapshot/graph.json

- **Cây thư mục `src/`:** [`FOLDER_TREE.md`](FOLDER_TREE.md) (ASCII từ `../snapshot/graph.json`).
- **Thống kê graph:** [`GRAPH_STATS.md`](GRAPH_STATS.md) — quy mô node/link, top file in/out-degree (điểm nóng import).

## Thống kê
- **totalFiles:** 51
- **clientComponents:** 22

## Trang (pages) (14)
- `src/app/categories/page.tsx`
- `src/app/contact-requests/page.tsx`
- `src/app/data/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/login/page.tsx`
- `src/app/my-students/page.tsx`
- `src/app/page.tsx`
- `src/app/parent-students/page.tsx`
- `src/app/posts/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/rbac/page.tsx`
- `src/app/register/page.tsx`
- `src/app/staff/page.tsx`
- `src/app/tags/page.tsx`

## Layout (1)
- `src/app/layout.tsx`

## Góc hệ thống (@backend) — đường dẫn gợi ý

- **Root layout:** `src/app/layout.tsx`

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `components.json` | config | — | — | — |
| `next.config.ts` | config | — | — | — |
| `package.json` | config | — | — | — |
| `src/app/data/page.tsx` | page | yes | DataBackupPage | src/lib/auth-session.ts, src/components/admin-page-guard.tsx |
| `src/app/guides/page.tsx` | page | yes | GuidesPage | src/lib/api.ts, src/lib/auth-session.ts, src/components/admin-page-guard.tsx |
| `src/app/layout.tsx` | layout | no | metadata, RootLayout | src/app/page.tsx, src/providers/query-provider.tsx, src/providers/auth-provider.tsx, src/components/admin-shell.tsx |
| `src/app/loading.tsx` | loading | no | Loading |  |
| `src/app/login/page.tsx` | page | no | AdminLoginPage | src/features/auth/sign-in-form.tsx |
| `src/app/my-students/page.tsx` | page | yes | MyStudentsPage | src/providers/auth-provider.tsx, src/lib/api.ts |
| `src/app/page.tsx` | page | yes | QUICK_LINKS, AdminDashboardPage | src/providers/auth-provider.tsx, src/lib/api.ts, src/types/dashboard.ts, src/components/dashboard-charts.tsx |
| `src/app/parent-students/page.tsx` | page | yes | AdminParentStudentsPage | src/components/admin-data-table, src/components/admin-confirm-action-dialog.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts |
| `src/app/profile/page.tsx` | page | yes | AdminProfilePage | src/providers/auth-provider.tsx, src/lib/permission-labels.ts, src/hooks/queries.ts, src/lib/api.ts, src/lib/auth-session.ts |
| `src/app/register/page.tsx` | page | no | RegisterPage | src/features/auth/register-form.tsx |
| `src/app/robots.ts` | ts | no | robots |  |
| `src/app/tags/page.tsx` | page | yes | TagsPage | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/components/admin-confirm-action-dialog.tsx, src/components/admin-page-guard.tsx, src/lib/api.ts, src/hooks/use-de |
| `src/components/admin-confirm-action-dialog.tsx` | tsx | yes | AdminConfirmActionDialog |  |
| `src/components/admin-data-table/admin-data-table.tsx` | tsx | yes | AdminDataTableBulkAction, AdminDataTableProps, AdminDataTable | src/lib/build-table-csv.ts, src/lib/export-csv.ts, src/lib/export-xlsx.ts |
| `src/components/admin-data-table/index.ts` | ts | no | AdminDataTable | src/components/admin-data-table/admin-data-table.tsx |
| `src/components/admin-data-table/table-meta.ts` | ts | no |  |  |
| `src/components/admin-notification-bell.tsx` | tsx | yes | AdminNotificationBell |  |
| `src/components/admin-page-guard.tsx` | tsx | yes | AdminPageGuard | src/providers/auth-provider.tsx |
| `src/components/admin-shell.tsx` | tsx | yes | AdminShell | src/components/sidebar.tsx, src/providers/auth-provider.tsx, src/components/admin-notification-bell.tsx, src/lib/auth-session.ts, src/lib/auth-routes.ts |
| `src/components/admin-table-pagination-footer.tsx` | tsx | yes | ADMIN_TABLE_PAGE_SIZE_OPTIONS, AdminTablePaginationFooterProps, AdminTablePaginationFooter |  |
| `src/components/api-scope-notice.tsx` | tsx | yes | ApiScopeNotice |  |
| `src/components/dashboard-charts.tsx` | tsx | yes | MonthlyLineChart, MonthlyBarChart, CategoryDoughnutChart, TopPostsChart | src/types/dashboard.ts |
| `src/components/sidebar.tsx` | tsx | yes | getVisibleMenuItems, SidebarNavLinks, MobileSidebarPanel, Sidebar | src/providers/auth-provider.tsx, src/lib/api.ts |
| `src/features/auth/admin-bridge.ts` | ts | no | getAdminBaseUrl, buildAdminBridgeLoginUrl, getAdminLoginUrl |  |
| `src/features/auth/auth-api.ts` | ts | no | AuthLoginPayload, RegisterRequestPayload, RegisterLeadPayload, DevLoginOption, loginWithEmail, loginWithDevelopmentUser, toAdminSessionUser, registerAccount, submitRegisterRequest |  |
| `src/features/auth/index.ts` | ts | no | SignInForm, RegisterForm | src/features/auth/sign-in-form.tsx, src/features/auth/register-form.tsx |
| `src/features/auth/register-form.tsx` | tsx | yes | RegisterForm | src/lib/auth-routes.ts, src/features/auth/auth-api.ts |
| `src/features/auth/session.ts` | ts | no | StoreSessionPayload, toStoreSession, persistSession | src/features/auth/auth-api.ts |
| `src/features/auth/sign-in-form.tsx` | tsx | yes | SignInForm | src/providers/auth-provider.tsx, src/features/auth/auth-api.ts, src/lib/auth-routes.ts, src/lib/auth-session.ts |
| `src/hooks/queries.ts` | ts | yes | queryKeys, CategoriesListData, UsersListData, RbacCatalog, useCategories, useCategoriesAdmin, useTrashedCategories, useCategoryUsage, useCreateCategory, useUpdateCategory, useDeleteCategory, useRestor | src/lib/api.ts |
| `src/hooks/use-debounced-value.ts` | ts | yes | useDebouncedValue |  |
| `src/lib/admin-ui.ts` | ts | no | ADMIN_INFO_CARD_CLASS, ADMIN_LOGIN_PANEL_CLASS |  |
| `src/lib/api.ts` | ts | no | api, ApiError | src/lib/auth-session.ts |
| `src/lib/auth-routes.ts` | ts | no | AUTH_LOGIN_PATH, AUTH_REGISTER_PATH, AUTH_PATHS, AuthPath, isAuthPath, getAdminAppHomeExternalPath, getAdminLoginExternalPath |  |
| `src/lib/auth-session.ts` | ts | no | ADMIN_SESSION_KEY, ADMIN_SESSION_EVENT, readAdminSession, writeAdminSession, patchAdminSessionProfile, clearAdminSession, getAdminUserId, getAdminDevAuthLogContext |  |
| `src/lib/build-table-csv.ts` | ts | no | buildCsvFromColumns |  |
| `src/lib/category-icons.ts` | ts | no | CATEGORY_ICON_OPTIONS, resolveCategoryIcon |  |
| `src/lib/dev-demo-accounts.ts` | ts | no | DevDemoAccount, DEV_DEMO_ACCOUNTS, isDevDemoLoginEnabled |  |
| `src/lib/export-csv.ts` | ts | no | CsvDelimiter, CsvEncoding, CsvExportOptions, escapeDelimitedField, escapeCsvField, rowsToCsvContent, csvToBlobParts, csvToUtf8BlobParts, downloadCsvFile |  |
| `src/lib/export-xlsx.ts` | ts | no | csvBaseToXlsxFilename |  |
| `src/lib/format.ts` | ts | no | formatVND, formatDate |  |
| `src/lib/permission-labels.ts` | ts | no | PERMISSION_LABEL_VI, permissionLabelVi, permissionGroupKey, permissionGroupLabelVi |  |
| `src/lib/product-price.ts` | ts | no | unitSellingAndListPrice |  |
| `src/providers/auth-provider.tsx` | tsx | yes | StaffLoginResult, AuthProvider, useAuth, useClientReady | src/features/auth/auth-api.ts, src/lib/auth-session.ts, src/lib/auth-routes.ts |
| `src/providers/query-provider.tsx` | tsx | yes | QueryProvider |  |
| `src/proxy.ts` | ts | no | proxy, config |  |
| `src/types/dashboard.ts` | ts | no | DashboardOverviewDto, DashboardMonthlyItemDto, DashboardCategoryItemDto, DashboardTopPostDto, DashboardStatsDto |  |
| `tsconfig.json` | config | — | — | — |
## File Markdown trong scope app

Toàn bộ `.md` sinh tự động nằm trong **`apps/backend/.graphify/markdown/`**; JSON trong **`../snapshot/`** — xem mục **Mục lục artefact Graphify** ở đầu file.

- **Chỉ mục monorepo + chủ đề:** [`../../../../.graphify/markdown/SUMMARY_FOR_AI.md`](../../../../.graphify/markdown/SUMMARY_FOR_AI.md).

## Làm mới

- Cập nhật `snapshot/context.json` **và** `snapshot/graph.json`: `node apps/backend/.graphify/update.cjs`.
- Sau đó chạy: `pnpm graphify:ai-summary` (sinh thêm `FOLDER_TREE.md`, `GRAPH_STATS.md` khi có graph).
