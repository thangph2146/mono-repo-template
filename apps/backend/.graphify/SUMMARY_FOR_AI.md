# Admin Next — @backend — tóm tắt cho AI (Graphify)

> Tự động sinh từ `context.json` — **đọc file này trước**; tránh đọc full `context.json` (có nhúng source đầy đủ).

- **projectRoot:** `C:/ThangPham/Source/store-sync/apps/backend`
- **context.generatedAt:** 2026-05-11T06:41:11.705Z

## Thống kê
- **totalFiles:** 41
- **clientComponents:** 16

## Trang (pages) (11)
- `src/app/categories/page.tsx`
- `src/app/data/page.tsx`
- `src/app/inventory/page.tsx`
- `src/app/locations/page.tsx`
- `src/app/login/page.tsx`
- `src/app/orders/page.tsx`
- `src/app/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/promo-codes/page.tsx`
- `src/app/register/page.tsx`
- `src/app/staff/page.tsx`

## Layout (1)
- `src/app/layout.tsx`

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `components.json` | config | — | — | — |
| `next.config.ts` | config | — | — | — |
| `package.json` | config | — | — | — |
| `src/app/data/page.tsx` | page | yes | DataBackupPage | src/lib/auth-session.ts |
| `src/app/inventory/product-form.ts` | ts | no | MAX_PRODUCT_IMAGE_BYTES, validateProductImageField, productFormSchema, ProductFormValues, defaultUnitRow, defaultProductForm, productToFormValues, formValuesToCreatePayload | src/lib/api.ts |
| `src/app/layout.tsx` | layout | no | metadata, RootLayout | src/app/page.tsx, src/providers/query-provider.tsx, src/providers/auth-provider.tsx, src/components/admin-shell.tsx |
| `src/app/loading.tsx` | loading | no | Loading |  |
| `src/app/locations/page.tsx` | page | yes | StoreLocationsPage | src/lib/api.ts, src/hooks/queries.ts, src/lib/export-csv.ts, src/lib/export-xlsx.ts |
| `src/app/login/page.tsx` | page | yes | AdminLoginPage | src/providers/auth-provider.tsx, src/lib/dev-demo-accounts.ts, src/lib/admin-ui.ts |
| `src/app/page.tsx` | page | yes | AdminDashboardPage | src/hooks/queries.ts, src/lib/format.ts, src/providers/auth-provider.tsx |
| `src/app/profile/page.tsx` | page | yes | AdminProfilePage | src/providers/auth-provider.tsx, src/lib/permission-labels.ts, src/hooks/queries.ts, src/lib/api.ts, src/lib/auth-session.ts |
| `src/app/promo-codes/page.tsx` | page | yes | PromoCodesAdminPage | src/components/admin-data-table, src/components/admin-table-pagination-footer.tsx, src/hooks/queries.ts, src/hooks/use-debounced-value.ts, src/providers/auth-provider.tsx, src/lib/api.ts |
| `src/app/register/page.tsx` | page | yes | AdminRegisterInfoPage | src/lib/admin-ui.ts |
| `src/components/admin-data-table/admin-data-table.tsx` | tsx | yes | AdminDataTableProps, AdminDataTable | src/lib/build-table-csv.ts, src/lib/export-csv.ts, src/lib/export-xlsx.ts |
| `src/components/admin-data-table/index.ts` | ts | no | AdminDataTable | src/components/admin-data-table/admin-data-table.tsx |
| `src/components/admin-data-table/table-meta.ts` | ts | no |  |  |
| `src/components/admin-shell.tsx` | tsx | yes | AdminShell | src/components/sidebar.tsx, src/providers/auth-provider.tsx, src/lib/auth-session.ts, src/lib/auth-routes.ts |
| `src/components/admin-table-pagination-footer.tsx` | tsx | yes | ADMIN_TABLE_PAGE_SIZE_OPTIONS, AdminTablePaginationFooterProps, AdminTablePaginationFooter |  |
| `src/components/sidebar.tsx` | tsx | yes | getVisibleMenuItems, SidebarNavLinks, MobileSidebarPanel, Sidebar | src/providers/auth-provider.tsx, src/lib/api.ts |
| `src/components/ui/sidebar.tsx` | tsx | yes | Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenu |  |
| `src/hooks/queries.ts` | ts | yes | queryKeys, ProductsListData, useProducts, useCreateProduct, useUpdateProduct, useAdjustStock, useDeleteProduct, useTrashedProducts, useRestoreProduct, usePurgeTrashedProduct, useCategories, Categories | src/lib/api.ts |
| `src/hooks/use-debounced-value.ts` | ts | yes | useDebouncedValue |  |
| `src/lib/admin-inventory-tree.ts` | ts | no | ProductTreeRow, getProductSubRows, productsToTreeRows | src/lib/api.ts |
| `src/lib/admin-orders-tree.ts` | ts | no | OrderTreeRow, getOrderSubRows, ordersToTreeRows | src/lib/api.ts |
| `src/lib/admin-ui.ts` | ts | no | ADMIN_LOGIN_PANEL_CLASS, ADMIN_INFO_CARD_CLASS |  |
| `src/lib/api.ts` | ts | no | api, ApiError | src/lib/auth-session.ts |
| `src/lib/auth-routes.ts` | ts | no | AUTH_PATHS, AuthPath, isAuthPath |  |
| `src/lib/auth-session.ts` | ts | no | ADMIN_SESSION_KEY, ADMIN_SESSION_EVENT, readAdminSession, writeAdminSession, patchAdminSessionProfile, clearAdminSession, getAdminUserId, getAdminDevAuthLogContext |  |
| `src/lib/build-table-csv.ts` | ts | no | buildCsvFromColumns |  |
| `src/lib/category-icons.ts` | ts | no | CATEGORY_ICON_OPTIONS, resolveCategoryIcon |  |
| `src/lib/dev-demo-accounts.ts` | ts | no | DevDemoAccount, DEV_DEMO_ACCOUNTS, isDevDemoLoginEnabled |  |
| `src/lib/export-csv.ts` | ts | no | CsvDelimiter, CsvEncoding, CsvExportOptions, escapeDelimitedField, escapeCsvField, rowsToCsvContent, csvToBlobParts, csvToUtf8BlobParts, downloadCsvFile |  |
| `src/lib/export-xlsx.ts` | ts | no | csvBaseToXlsxFilename |  |
| `src/lib/format.ts` | ts | no | formatVND, formatDate |  |
| `src/lib/inventory-api-filters.ts` | ts | no | inventoryFiltersToProductListParams, applyInventoryLineOnlyFilter, inventoryHasLineOnlyFilter | src/lib/admin-inventory-tree.ts |
| `src/lib/permission-labels.ts` | ts | no | PERMISSION_LABEL_VI, permissionLabelVi |  |
| `src/lib/product-price.ts` | ts | no | unitSellingAndListPrice | src/lib/api.ts |
| `src/middleware.ts` | middleware | no | middleware, config |  |
| `src/providers/auth-provider.tsx` | tsx | yes | StaffLoginResult, AuthProvider, useAuth, useClientReady | src/lib/api.ts, src/lib/auth-session.ts |
| `src/providers/query-provider.tsx` | tsx | yes | QueryProvider | src/lib/api.ts |
| `tsconfig.json` | config | — | — | — |

## Làm mới

- Cập nhật `context.json`: theo pipeline Graphify của app (vd. `update.cjs` / graphifyy).
- Sau đó chạy: `pnpm graphify:ai-summary`
