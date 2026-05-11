# Storefront — @frontend — tóm tắt cho AI (Graphify)

> Tự động sinh từ `context.json` — **đọc file này trước**; tránh đọc full `context.json` (có nhúng source đầy đủ).

- **projectRoot:** `C:/ThangPham/Source/store-sync/apps/frontend`
- **context.generatedAt:** 2026-05-11T06:41:15.048Z

## Thống kê
- **totalFiles:** 83
- **clientComponents:** 30

## Trang (pages) (16)
- `src/app/(store-sync)/cart/page.tsx`
- `src/app/(store-sync)/catalog/page.tsx`
- `src/app/(store-sync)/catalog/[productId]/page.tsx`
- `src/app/(store-sync)/checkout/page.tsx`
- `src/app/(store-sync)/dashboard/page.tsx`
- `src/app/(store-sync)/help/page.tsx`
- `src/app/(store-sync)/login/page.tsx`
- `src/app/(store-sync)/orders/page.tsx`
- `src/app/(store-sync)/orders/[orderId]/page.tsx`
- `src/app/(store-sync)/privacy/page.tsx`
- `src/app/(store-sync)/profile/page.tsx`
- `src/app/(store-sync)/register/page.tsx`
- `src/app/(store-sync)/support/page.tsx`
- `src/app/(store-sync)/terms/page.tsx`
- `src/app/graph/page.tsx`
- `src/app/page.tsx`

## Layout (17)
- `src/app/(store-sync)/cart/layout.tsx`
- `src/app/(store-sync)/catalog/layout.tsx`
- `src/app/(store-sync)/catalog/[productId]/layout.tsx`
- `src/app/(store-sync)/checkout/layout.tsx`
- `src/app/(store-sync)/dashboard/layout.tsx`
- `src/app/(store-sync)/help/layout.tsx`
- `src/app/(store-sync)/layout.tsx`
- `src/app/(store-sync)/login/layout.tsx`
- `src/app/(store-sync)/orders/layout.tsx`
- `src/app/(store-sync)/orders/[orderId]/layout.tsx`
- `src/app/(store-sync)/privacy/layout.tsx`
- `src/app/(store-sync)/profile/layout.tsx`
- `src/app/(store-sync)/register/layout.tsx`
- `src/app/(store-sync)/support/layout.tsx`
- `src/app/(store-sync)/terms/layout.tsx`
- `src/app/graph/layout.tsx`
- `src/app/layout.tsx`

## API routes (1)
- `src/app/api/graphify/route.ts`

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `components.json` | config | — | — | — |
| `next.config.ts` | config | — | — | — |
| `package.json` | config | — | — | — |
| `src/app/(store-sync)/cart/layout.tsx` | layout | no | metadata, CartLayout | src/app/(store-sync)/cart/page.tsx |
| `src/app/(store-sync)/cart/loading.tsx` | loading | no | CartLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/cart/page.tsx` | page | yes | CartPage | src/hooks/use-cart.ts, src/components/shared/cart-line-item.tsx, src/components/shared/cart-order-summary.tsx |
| `src/app/(store-sync)/catalog/[productId]/layout.tsx` | layout | no | metadata, ProductDetailLayout | src/app/(store-sync)/catalog/[productId]/page.tsx |
| `src/app/(store-sync)/catalog/[productId]/loading.tsx` | loading | no | ProductDetailLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/catalog/[productId]/page.tsx` | page | yes | ProductDetailPage | src/components/shared/product-detail.tsx, src/hooks/queries.ts |
| `src/app/(store-sync)/catalog/layout.tsx` | layout | no | metadata, CatalogLayout | src/app/(store-sync)/catalog/page.tsx |
| `src/app/(store-sync)/catalog/loading.tsx` | loading | no | CatalogLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/catalog/page.tsx` | page | yes | CatalogPage | src/lib/api.ts, src/hooks/queries.ts, src/hooks/use-debounced-value.ts, src/hooks/use-cart.ts, src/lib/format.ts, src/lib/catalog-filters.ts, src/lib/product-price.ts, src/lib/category-icons.ts |
| `src/app/(store-sync)/checkout/layout.tsx` | layout | no | metadata, CheckoutLayout | src/app/(store-sync)/checkout/page.tsx |
| `src/app/(store-sync)/checkout/loading.tsx` | loading | no | CheckoutLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/checkout/page.tsx` | page | yes | CheckoutPage | src/hooks/use-cart.ts, src/hooks/use-session.ts, src/hooks/queries.ts, src/lib/api.ts, src/lib/format.ts, src/components/shared/cart-line-item.tsx, src/components/shared/cart-order-summary.tsx |
| `src/app/(store-sync)/dashboard/layout.tsx` | layout | no | metadata, DashboardLayout | src/app/(store-sync)/dashboard/page.tsx |
| `src/app/(store-sync)/dashboard/page.tsx` | page | no | DashboardPage |  |
| `src/app/(store-sync)/help/layout.tsx` | layout | no | metadata, HelpLayout | src/app/(store-sync)/help/page.tsx |
| `src/app/(store-sync)/help/page.tsx` | page | no | HelpPage |  |
| `src/app/(store-sync)/layout.tsx` | layout | no | StoreSyncLayout | src/components/shared/store-auth-gate.tsx |
| `src/app/(store-sync)/login/layout.tsx` | layout | no | metadata, LoginLayout | src/app/(store-sync)/login/page.tsx |
| `src/app/(store-sync)/login/page.tsx` | page | yes | LoginPage | src/lib/api.ts, src/lib/auth-routes.ts, src/lib/cart-sync.ts, src/lib/store-ui.ts |
| `src/app/(store-sync)/orders/[orderId]/layout.tsx` | layout | no | metadata, OrderDetailLayout | src/app/(store-sync)/orders/[orderId]/page.tsx |
| `src/app/(store-sync)/orders/[orderId]/loading.tsx` | loading | no | OrderDetailLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/orders/[orderId]/page.tsx` | page | yes | OrderDetailPage | src/lib/api.ts, src/hooks/queries.ts, src/lib/format.ts, src/hooks/use-session.ts |
| `src/app/(store-sync)/orders/layout.tsx` | layout | no | metadata, OrdersLayout | src/app/(store-sync)/orders/page.tsx |
| `src/app/(store-sync)/orders/loading.tsx` | loading | no | OrdersLoading | src/components/shared/route-loading.tsx |
| `src/app/(store-sync)/orders/page.tsx` | page | yes | OrdersPage | src/hooks/use-debounced-value.ts, src/lib/api.ts, src/hooks/queries.ts, src/hooks/use-session.ts, src/lib/format.ts, src/components/shared/order-status-table.tsx |
| `src/app/(store-sync)/privacy/layout.tsx` | layout | no | metadata, PrivacyLayout | src/app/(store-sync)/privacy/page.tsx |
| `src/app/(store-sync)/privacy/page.tsx` | page | no | PrivacyPage |  |
| `src/app/(store-sync)/profile/layout.tsx` | layout | no | metadata, ProfileLayout | src/app/(store-sync)/profile/page.tsx |
| `src/app/(store-sync)/profile/page.tsx` | page | yes | ProfilePage | src/components/shared/store-location-map-picker.tsx, src/hooks/queries.ts, src/hooks/use-session.ts, src/lib/api.ts |
| `src/app/(store-sync)/register/layout.tsx` | layout | no | metadata, RegisterLayout | src/app/(store-sync)/register/page.tsx |
| `src/app/(store-sync)/register/page.tsx` | page | yes | RegisterPage | src/lib/store-ui.ts |
| `src/app/(store-sync)/support/layout.tsx` | layout | no | metadata, SupportLayout | src/app/(store-sync)/support/page.tsx |
| `src/app/(store-sync)/support/page.tsx` | page | no | SupportPage |  |
| `src/app/(store-sync)/terms/layout.tsx` | layout | no | metadata, TermsLayout | src/app/(store-sync)/terms/page.tsx |
| `src/app/(store-sync)/terms/page.tsx` | page | no | TermsPage |  |
| `src/app/api/graphify/route.ts` | api-route | no |  | src/lib/graphify-context.ts |
| `src/app/graph/layout.tsx` | layout | no | metadata, GraphLayout | src/app/graph/page.tsx |
| `src/app/graph/loading.tsx` | loading | no | GraphLoading | src/components/shared/route-loading.tsx |
| `src/app/graph/page.tsx` | page | yes | GraphPage | src/hooks/use-graphify.ts, src/lib/graphify-context.ts, src/components/graphify/force-graph-3d.tsx |
| `src/app/layout.tsx` | layout | no | metadata, RootLayout | src/app/page.tsx, src/components/shared/header.tsx, src/components/shared/footer.tsx, src/providers/query-provider.tsx, src/components/shared/cart-sync-bridge.tsx, src/components/shared/promo-rules-sy |
| `src/app/page.tsx` | page | yes | Home | src/components/shared/product-card.tsx, src/components/shared/product-wide-card.tsx, src/hooks/queries.ts, src/lib/category-icons.ts, src/lib/format.ts, src/lib/api.ts |
| `src/components/graphify/force-graph-3d.tsx` | tsx | yes | GraphifyForceGraph3D | src/lib/graphify-context.ts |
| `src/components/shared/cart-drawer.tsx` | tsx | yes | CartDrawer | src/hooks/use-cart.ts, src/lib/format.ts |
| `src/components/shared/cart-line-item.tsx` | tsx | yes | cartLineMaxQty, CartLineItem | src/hooks/use-cart.ts, src/lib/format.ts |
| `src/components/shared/cart-order-summary.tsx` | tsx | yes | CartOrderSummary, CheckoutPromoField | src/hooks/use-cart.ts, src/lib/format.ts |
| `src/components/shared/cart-sync-bridge.tsx` | tsx | yes | CartSyncBridge | src/hooks/use-session.ts, src/hooks/use-cart.ts, src/lib/cart-sync.ts |
| `src/components/shared/footer.tsx` | tsx | no | Footer |  |
| `src/components/shared/header.tsx` | tsx | yes | Header | src/hooks/use-cart.ts, src/hooks/use-session.ts |
| `src/components/shared/order-status-table.tsx` | tsx | no | OrderStatusTableRow, OrderStatusTable |  |
| `src/components/shared/product-card.tsx` | tsx | yes | ProductCard |  |
| `src/components/shared/product-detail.tsx` | tsx | yes | ProductDetail | src/lib/api.ts, src/lib/format.ts, src/lib/product-price.ts, src/hooks/queries.ts, src/hooks/use-cart.ts |
| `src/components/shared/product-wide-card.tsx` | tsx | yes | ProductWideCard |  |
| `src/components/shared/promo-rules-sync.tsx` | tsx | yes | PromoRulesSync | src/lib/api.ts, src/lib/promo-rules-registry.ts |
| `src/components/shared/route-loading.tsx` | tsx | no | RouteLoading |  |
| `src/components/shared/store-auth-gate.tsx` | tsx | yes | StoreAuthGate | src/hooks/use-session.ts, src/hooks/use-client-ready.ts, src/lib/auth-routes.ts |
| `src/components/shared/store-location-map-picker.tsx` | tsx | yes | StoreLocationMapPicker |  |
| `src/hooks/queries.ts` | ts | yes | queryKeys, useProducts, useCatalogProducts, useCategoryUsage, useProduct, useProductBySku, useCategories, useCategoryBySlug, useOrders, useOrder, useUserByEmail, useUserById, useUpdateProfile, useCrea | src/lib/api.ts |
| `src/hooks/use-cart.ts` | ts | yes | CartLine, cartLineKey, cartLineQuantity, mergeLinesForCreateOrder, cartStore, CartSummary, useCart | src/lib/promo-rules-registry.ts, src/lib/api.ts |
| `src/hooks/use-client-ready.ts` | ts | yes | useClientReady |  |
| `src/hooks/use-debounced-value.ts` | ts | yes | useDebouncedValue |  |
| `src/hooks/use-graphify.ts` | ts | yes | UseGraphifyReturn, useGraphify | src/lib/graphify-context.ts |
| `src/hooks/use-mobile.ts` | ts | no | useIsMobile |  |
| `src/hooks/use-session.ts` | ts | yes | MockSession, useSession |  |
| `src/hooks/useTodos.ts` | ts | no | TodoFilter, TodoStats, useTodos | src/types/todo.ts, src/lib/utils.ts, src/lib/storage.ts |
| `src/lib/api.ts` | ts | no | api, ApiError |  |
| `src/lib/auth-routes.ts` | ts | no | STORE_AUTH_PATHS, isStoreAuthPath, safeRelativeNext |  |
| `src/lib/cart-sync.ts` | ts | no |  | src/lib/api.ts, src/hooks/use-cart.ts |
| `src/lib/catalog-filters.ts` | ts | no | getProductUnits, scoreProductSearchMatch, productMatchesCatalogFilters | src/lib/api.ts |
| `src/lib/category-icons.ts` | ts | no | CATEGORY_ICON_OPTIONS, resolveCategoryIcon |  |
| `src/lib/format.ts` | ts | no | formatVND, formatDate, formatDateShort |  |
| `src/lib/graphify-context.ts` | ts | no | GraphNode, GraphLink, GraphData, FileEntry, ContextData, GraphifyPayload, nodeColorByCommunity, emojiForType, resolveSourceFile, exportsOfFile, importedBy, importsOf, getLinkedNodes, communityBreakdow |  |
| `src/lib/product-price.ts` | ts | no | unitSellingAndListPrice | src/lib/api.ts |
| `src/lib/promo-rules-registry.ts` | ts | no | setStorefrontPromoRulesFromApi, getMergedPromoRules |  |
| `src/lib/storage.ts` | ts | no | StorageLib |  |
| `src/lib/store-ui.ts` | ts | no | STORE_AUTH_FORM_CARD_CLASS |  |
| `src/lib/utils.ts` | ts | no | cn, generateId |  |
| `src/middleware.ts` | middleware | no | middleware, config |  |
| `src/providers/query-provider.tsx` | tsx | yes | QueryProvider | src/lib/api.ts |
| `src/types/todo.ts` | ts | no | Todo |  |
| `tsconfig.json` | config | — | — | — |

## Làm mới

- Cập nhật `context.json`: theo pipeline Graphify của app (vd. `update.cjs` / graphifyy).
- Sau đó chạy: `pnpm graphify:ai-summary`
