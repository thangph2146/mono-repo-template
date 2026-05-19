# Thống kê graph — frontend (Graphify)

> **Sinh tự động:** `2026-05-19T09:31:09.588Z` từ `../snapshot/graph.json` — giúp AI nắm **quy mô** và **điểm nóng import** mà không mở full graph.

## Nodes theo `type`

| type | Số |
|------|-----|
| `tsx` | 36 |
| `directory` | 28 |
| `ts` | 25 |
| `page` | 9 |
| `layout` | 3 |
| `api-route` | 1 |
| `loading` | 1 |
| `route-group` | 1 |

## Links theo `relation`

| relation | Số |
|----------|-----|
| `contains` | 102 |
| `imports` | 92 |
| `assets` | 2 |
| `renders` | 2 |

## Top file theo số cạnh `imports` đi ra (out-degree)

Các file `src/...` import nhiều target nhất (thường là module barrel, service lớn, hoặc controller “dày”).

| File | Số cạnh imports |
|------|-----------------|
| `src/features/pages/about-page/about-client.tsx` | 11 |
| `src/features/pages/home-page/sub-sections/index.ts` | 8 |
| `src/app/(public)/layout.tsx` | 6 |
| `src/features/pages/home-page/home-client.tsx` | 6 |
| `src/app/(public)/bai-viet/[slug]/page.tsx` | 5 |
| `src/features/pages/home-page/index.ts` | 4 |
| `src/app/(public)/bai-viet/page.tsx` | 3 |
| `src/components/shared/store-auth-gate.tsx` | 3 |
| `src/features/pages/home-page/sub-sections/hero-section.tsx` | 3 |
| `src/hooks/useTodos.ts` | 3 |
| `src/app/(public)/huong-dan-su-dung/page.tsx` | 2 |
| `src/app/(public)/lien-he/page.tsx` | 2 |
| `src/app/(public)/page.tsx` | 2 |
| `src/app/(public)/ve-chung-toi/page.tsx` | 2 |
| `src/components/shared/header.tsx` | 2 |
| `src/features/pages/about-page/sub-sections/core-values-section.tsx` | 2 |
| `src/features/pages/about-page/sub-sections/education-philosophy-section.tsx` | 2 |
| `src/features/pages/about-page/sub-sections/index.ts` | 2 |
| `src/features/pages/home-page/sub-sections/about-hub-section.tsx` | 2 |
| `src/features/pages/home-page/sub-sections/guide-register-section.tsx` | 2 |

## Top file theo số cạnh `imports` đi vào (in-degree)

File được nhiều nguồn import tới (tiện ích dùng chung, entity, type, helper).

| File | Số lần bị import |
|------|------------------|
| `src/lib/seo.ts` | 9 |
| `src/features/pages/about-page/constants.tsx` | 6 |
| `src/features/auth/admin-bridge.ts` | 5 |
| `src/features/pages/home-page/sub-sections/scroll-indicator.tsx` | 5 |
| `src/features/pages/home-page/constants.ts` | 4 |
| `src/features/pages/home-page/sub-sections/contact-section.tsx` | 3 |
| `src/lib/dev-route-log.ts` | 2 |
| `src/lib/public-posts.ts` | 2 |
| `src/components/icons/logo.tsx` | 2 |
| `src/lib/scroll.ts` | 2 |
| `src/features/pages/about-page/about-client.tsx` | 2 |
| `src/features/pages/about-page/utils.tsx` | 2 |
| `src/features/pages/home-page/sub-sections/hero-section.tsx` | 2 |
| `src/features/pages/home-page/data.tsx` | 2 |
| `src/features/pages/home-page/sub-sections/about-hub-section.tsx` | 2 |

## Làm mới

Chạy `node apps/frontend/.graphify/update.cjs` rồi `pnpm graphify:ai-summary`.
