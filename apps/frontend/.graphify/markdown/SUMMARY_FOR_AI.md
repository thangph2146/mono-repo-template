# Hub storefront — @frontend — tóm tắt cho AI (Graphify)

> Tự động sinh từ `../snapshot/context.json` — **đọc file này trước**; tránh mở toàn bộ JSON snapshot (nhúng source đầy đủ).

- **projectRoot:** `D:/HUB/working/2026/hub-parrent-template/apps/frontend`
- **context.generatedAt:** 2026-05-14T07:52:06.359Z

## Mục lục artefact Graphify

- **Markdown (ưu tiên đọc):** file này — [`FOLDER_TREE.md`](FOLDER_TREE.md), [`GRAPH_STATS.md`](GRAPH_STATS.md)
- **Snapshot (JSON nặng):** [`../snapshot/context.json`](../snapshot/context.json), [`../snapshot/graph.json`](../snapshot/graph.json) — chỉ mở khi cần trích source hoặc đồ thị đầy đủ.
- **Quy ước thư mục `.graphify` (tay):** [`../README.md`](../README.md).

## Liên kết dịch vụ & tài liệu hub

App **không** import chéo source `apps/*`; giao tiếp qua **HTTP** + `@workspace/api-client` (và `fetch` public ở storefront khi cần).

### Graphify — markdown các phần còn lại của monorepo

- **@backend:** [SUMMARY](../../../../apps/backend/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/backend/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/backend/.graphify/markdown/GRAPH_STATS.md)
- **@api:** [SUMMARY](../../../../apps/api/.graphify/markdown/SUMMARY_FOR_AI.md) · [FOLDER_TREE](../../../../apps/api/.graphify/markdown/FOLDER_TREE.md) · [GRAPH_STATS](../../../../apps/api/.graphify/markdown/GRAPH_STATS.md)
- **packages:** [SUMMARY](../../../../packages/.graphify/markdown/SUMMARY_FOR_AI.md) · [WORKSPACE_DEPS](../../../../packages/.graphify/markdown/WORKSPACE_DEPS.md)
- **monorepo (chỉ mục + chủ đề):** [SUMMARY gốc](../../../../.graphify/markdown/SUMMARY_FOR_AI.md)

### Tài liệu hub (không sinh bởi Graphify)

- [MICROSERVICE_SYSTEM_MAP](../../../../docs/hub-parent/MICROSERVICE_SYSTEM_MAP.md) — boundaries, ORM, checklist.
- [AGENTS_GUIDE](../../../../docs/hub-parent/AGENTS_GUIDE.md) — thứ tự đọc cho agent.
- [AGENTS.md](../../../../AGENTS.md) — `pnpm check`, `check:full`.
- [FRONTEND_UX](../../../../docs/hub-parent/FRONTEND_UX.md) — UX / token / a11y storefront.

## Bản đồ từ snapshot/graph.json

- **Cây thư mục `src/`:** [`FOLDER_TREE.md`](FOLDER_TREE.md) (ASCII từ `../snapshot/graph.json`).
- **Thống kê graph:** [`GRAPH_STATS.md`](GRAPH_STATS.md) — quy mô node/link, top file in/out-degree (điểm nóng import).

## Thống kê
- **totalFiles:** 81
- **clientComponents:** 23

## Trang (pages) (9)
- `src/app/(public)/bai-viet/page.tsx`
- `src/app/(public)/bai-viet/[slug]/page.tsx`
- `src/app/(public)/huong-dan-su-dung/page.tsx`
- `src/app/(public)/lien-he/page.tsx`
- `src/app/(public)/login/page.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/register/page.tsx`
- `src/app/(public)/ve-chung-toi/page.tsx`
- `src/app/graph/page.tsx`

## Layout (2)
- `src/app/(public)/layout.tsx`
- `src/app/graph/layout.tsx`

## API routes (1)
- `src/app/api/graphify/route.ts`

## Góc hệ thống (@frontend) — đường dẫn gợi ý

- **Route handlers dưới `src/app/api/`:** 1 file (danh sách `apiRoutes` ở trên nếu có).

## Module map (không có nội dung file)

| File | Loại | Client | Exports | Imports |
|------|------|--------|---------|---------|
| `components.json` | config | — | — | — |
| `next.config.ts` | config | — | — | — |
| `package.json` | config | — | — | — |
| `src/app/(public)/bai-viet/[slug]/page.tsx` | page | no |  | src/lib/dev-route-log.ts, src/lib/public-posts.ts, src/components/shared/post-content-renderer.tsx, src/components/shared/public-post-view-badge.tsx, src/lib/seo.ts |
| `src/app/(public)/bai-viet/page.tsx` | page | no | metadata | src/lib/dev-route-log.ts, src/lib/public-posts.ts, src/lib/seo.ts |
| `src/app/(public)/huong-dan-su-dung/guide-sections.tsx` | tsx | yes | GuideSections |  |
| `src/app/(public)/huong-dan-su-dung/page.tsx` | page | no | metadata | src/lib/seo.ts, src/app/(public)/huong-dan-su-dung/guide-sections.tsx |
| `src/app/(public)/layout.tsx` | layout | no | metadata, RootLayout | src/app/(public)/page.tsx, src/components/shared/header.tsx, src/components/shared/footer.tsx, src/providers/query-provider.tsx, src/components/shared/scroll-to-top.tsx, src/components/shared/store-au |
| `src/app/(public)/lien-he/page.tsx` | page | no | metadata, ContactPage | src/features/pages/home-page/sub-sections/contact-section.tsx, src/lib/seo.ts |
| `src/app/(public)/login/page.tsx` | page | no | LoginPage | src/features/auth/admin-bridge.ts |
| `src/app/(public)/page.tsx` | page | no | metadata, PublicHomePage | src/features/pages/home-page, src/lib/seo.ts |
| `src/app/(public)/register/page.tsx` | page | no | RegisterPage | src/features/auth/admin-bridge.ts |
| `src/app/(public)/ve-chung-toi/page.tsx` | page | no | metadata, AboutPage | src/features/pages/about-page, src/lib/seo.ts |
| `src/app/api/graphify/route.ts` | api-route | no |  | src/lib/graphify-context.ts |
| `src/app/graph/layout.tsx` | layout | no | metadata, GraphLayout | src/app/graph/page.tsx |
| `src/app/graph/loading.tsx` | loading | no | GraphLoading | src/components/shared/route-loading.tsx |
| `src/app/graph/page.tsx` | page | yes | GraphPage | src/hooks/use-graphify.ts, src/lib/graphify-context.ts, src/components/graphify/force-graph-3d.tsx |
| `src/app/robots.ts` | ts | no | robots | src/lib/seo.ts |
| `src/app/sitemap.ts` | ts | no | sitemap | src/lib/seo.ts |
| `src/components/graphify/force-graph-3d.tsx` | tsx | yes | GraphifyForceGraph3D | src/lib/graphify-context.ts |
| `src/components/icons/logo.tsx` | tsx | no | Logo |  |
| `src/components/shared/footer.tsx` | tsx | no | Footer | src/components/icons/logo.tsx |
| `src/components/shared/header.tsx` | tsx | yes | Header | src/features/auth/admin-bridge.ts, src/components/icons/logo.tsx |
| `src/components/shared/post-content-renderer.tsx` | tsx | yes | PostContentRenderer |  |
| `src/components/shared/public-post-view-badge.tsx` | tsx | yes | PublicPostViewBadge |  |
| `src/components/shared/route-loading.tsx` | tsx | no | RouteLoading |  |
| `src/components/shared/scroll-to-top.tsx` | tsx | yes | ScrollToTop | src/lib/scroll.ts |
| `src/components/shared/store-auth-gate.tsx` | tsx | yes | StoreAuthGate | src/hooks/use-session.ts, src/hooks/use-client-ready.ts, src/lib/auth-routes.ts |
| `src/features/auth/admin-bridge.ts` | ts | no | getAdminBaseUrl, getAdminLoginUrl, getAdminRegisterUrl |  |
| `src/features/pages/about-page/about-client.tsx` | tsx | yes | AboutClient | src/features/pages/about-page/sub-sections/overview-section.tsx, src/features/pages/about-page/sub-sections/about-hub-section.tsx, src/features/pages/about-page/sub-sections/history-section.tsx, src/f |
| `src/features/pages/about-page/about.tsx` | tsx | no | AboutProps, About | src/features/pages/about-page/about-client.tsx |
| `src/features/pages/about-page/constants.tsx` | tsx | no | CORE_VALUES, EDUCATION_PHILOSOPHY, FACILITIES_STATS, FACILITY_IMAGES, FACILITIES, DEPARTMENTS, HISTORY_TIMELINE, LEADER_GENERATIONS, getTimelineData |  |
| `src/features/pages/about-page/index.ts` | ts | no |  | src/features/pages/about-page/sub-sections |
| `src/features/pages/about-page/sub-sections/about-hub-section.tsx` | tsx | no | AboutHubSection |  |
| `src/features/pages/about-page/sub-sections/core-values-section.tsx` | tsx | no | CoreValuesSection | src/features/pages/about-page/utils.tsx, src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/departments-section.tsx` | tsx | no | DepartmentsSection | src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/education-philosophy-section.tsx` | tsx | no | EducationPhilosophySection | src/features/pages/about-page/utils.tsx, src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/facilities-section.tsx` | tsx | no | FacilitiesSection | src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/faculty-scientists-section.tsx` | tsx | no | FacultyScientistsSection |  |
| `src/features/pages/about-page/sub-sections/history-section.tsx` | tsx | yes | HistorySection | src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/index.ts` | ts | no | About, AboutClient | src/features/pages/about-page/about.tsx, src/features/pages/about-page/about-client.tsx |
| `src/features/pages/about-page/sub-sections/leaders-section.tsx` | tsx | no | LeadersSection | src/features/pages/about-page/constants.tsx |
| `src/features/pages/about-page/sub-sections/organization-structure-section.tsx` | tsx | no | OrganizationStructureSection |  |
| `src/features/pages/about-page/sub-sections/overview-section.tsx` | tsx | no | OverviewSection |  |
| `src/features/pages/about-page/sub-sections/vision-mission-section.tsx` | tsx | no | VisionMissionSection |  |
| `src/features/pages/about-page/utils.tsx` | tsx | no | highlightHUB |  |
| `src/features/pages/home-page/constants.ts` | ts | no | HOME_ROUTES | src/features/auth/admin-bridge.ts |
| `src/features/pages/home-page/data.tsx` | tsx | no | HERO_DATA | src/features/pages/home-page/constants.ts |
| `src/features/pages/home-page/home-client.tsx` | tsx | no | HomeClient | src/features/pages/home-page/sub-sections/hero-section.tsx, src/features/pages/home-page/data.tsx, src/features/pages/home-page/sub-sections/about-hub-section.tsx, src/features/pages/home-page/sub-sec |
| `src/features/pages/home-page/home.tsx` | tsx | no | HomeProps | src/features/pages/home-page/home-client.tsx |
| `src/features/pages/home-page/index.ts` | ts | no | Home, HomeClient | src/features/pages/home-page/home.tsx, src/features/pages/home-page/home-client.tsx, src/features/pages/home-page/data.tsx, src/features/pages/home-page/sub-sections |
| `src/features/pages/home-page/sub-sections/about-hub-section.tsx` | tsx | yes | AboutHubSection | src/features/pages/home-page/constants.ts, src/features/pages/home-page/sub-sections/scroll-indicator.tsx |
| `src/features/pages/home-page/sub-sections/contact-section.tsx` | tsx | yes | ContactSectionProps, ContactSection | src/lib/api.ts |
| `src/features/pages/home-page/sub-sections/content-card.tsx` | tsx | no | ContentCardButton, ContentCardProps, ContentCard |  |
| `src/features/pages/home-page/sub-sections/featured-posts-section.tsx` | tsx | yes | FeaturedPostsSectionProps, FeaturedPostsSection | src/features/pages/home-page/constants.ts |
| `src/features/pages/home-page/sub-sections/guide-register-section.tsx` | tsx | yes | GuideRegisterSection | src/features/pages/home-page/constants.ts, src/features/pages/home-page/sub-sections/scroll-indicator.tsx |
| `src/features/pages/home-page/sub-sections/hero-section.tsx` | tsx | yes | HeroButton, HeroSectionProps, HeroSection | src/features/pages/home-page/sub-sections/content-card.tsx, src/features/auth/admin-bridge.ts, src/features/pages/home-page/sub-sections/scroll-indicator.tsx |
| `src/features/pages/home-page/sub-sections/index.ts` | ts | no | HeroSection, AboutHubSection, OverviewSection, GuideRegisterSection, FeaturedPostsSection, ContactSection, ScrollIndicator | src/features/pages/home-page/sub-sections/hero-section.tsx, src/features/pages/home-page/sub-sections/about-hub-section.tsx, src/features/pages/home-page/sub-sections/overview-section.tsx, src/feature |
| `src/features/pages/home-page/sub-sections/overview-section.tsx` | tsx | yes | OverviewSection | src/features/pages/home-page/sub-sections/scroll-indicator.tsx |
| `src/features/pages/home-page/sub-sections/scroll-indicator.tsx` | tsx | yes | ScrollIndicatorProps, ScrollIndicator | src/lib/scroll.ts |
| `src/hooks/use-client-ready.ts` | ts | yes | useClientReady |  |
| `src/hooks/use-debounced-value.ts` | ts | yes | useDebouncedValue |  |
| `src/hooks/use-graphify.ts` | ts | yes | UseGraphifyReturn, useGraphify | src/lib/graphify-context.ts |
| `src/hooks/use-mobile.ts` | ts | no | useIsMobile |  |
| `src/hooks/use-session.ts` | ts | yes | MockSession, useSession |  |
| `src/hooks/useTodos.ts` | ts | no | TodoFilter, TodoStats, useTodos | src/types/todo.ts, src/lib/utils.ts, src/lib/storage.ts |
| `src/lib/api.ts` | ts | no | api, ApiError |  |
| `src/lib/auth-routes.ts` | ts | no | STORE_AUTH_PATHS, isStoreAuthPath, safeRelativeNext |  |
| `src/lib/category-icons.ts` | ts | no | CATEGORY_ICON_OPTIONS, resolveCategoryIcon |  |
| `src/lib/dev-route-log.ts` | ts | no |  |  |
| `src/lib/format.ts` | ts | no | formatVND, formatDate, formatDateShort |  |
| `src/lib/graphify-context.ts` | ts | no | GraphNode, GraphLink, GraphData, FileEntry, ContextData, GraphifyPayload, nodeColorByCommunity, emojiForType, resolveSourceFile, exportsOfFile, importedBy, importsOf, getLinkedNodes, communityBreakdow |  |
| `src/lib/public-posts.ts` | ts | no | PublicPostSummary, PublicPostDetail, PublicCategoryItem, formatPostDate |  |
| `src/lib/scroll.ts` | ts | yes | getHeaderHeight, scrollToYWithHeaderOffset |  |
| `src/lib/seo.ts` | ts | no | SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL, OG_IMAGE_URL, absoluteUrl, buildSeoMetadata |  |
| `src/lib/storage.ts` | ts | no | StorageLib |  |
| `src/lib/utils.ts` | ts | no | cn, generateId |  |
| `src/providers/query-provider.tsx` | tsx | yes | QueryProvider |  |
| `src/proxy.ts` | ts | no | proxy, config |  |
| `src/types/todo.ts` | ts | no | Todo |  |
| `tsconfig.json` | config | — | — | — |
## File Markdown trong scope app

Toàn bộ `.md` sinh tự động nằm trong **`apps/frontend/.graphify/markdown/`**; JSON trong **`../snapshot/`** — xem mục **Mục lục artefact Graphify** ở đầu file.

- **Chỉ mục monorepo + chủ đề:** [`../../../../.graphify/markdown/SUMMARY_FOR_AI.md`](../../../../.graphify/markdown/SUMMARY_FOR_AI.md).

## Làm mới

- Cập nhật `snapshot/context.json` **và** `snapshot/graph.json`: `node apps/frontend/.graphify/update.cjs`.
- Sau đó chạy: `pnpm graphify:ai-summary` (sinh thêm `FOLDER_TREE.md`, `GRAPH_STATS.md` khi có graph).
