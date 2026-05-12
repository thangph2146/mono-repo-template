# UX / UI — `apps/frontend` (hub-parent-template)

Tài liệu ngắn để agent và dev chỉnh storefront **không phá vận hành monorepo**: vẫn dùng `@ui/*`, `@workspace/api-client`, v.v. theo `MICROSERVICE_SYSTEM_MAP.md`.

## Nguồn palette (hub-parent)

Giá trị màu semantic (`--primary`, `--secondary`, sidebar, chart, `--brand-*`, …) **đồng bộ** với [`apps/hub-parent/src/app/globals.css`](../../apps/hub-parent/src/app/globals.css). Package `@ui` phân phối theme qua [`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css) (có thêm token `surface-*`, `shadcn/tailwind`, `@source` apps) — khi đổi brand, cập nhật **một nơi** ở hub-parent rồi copy/sửa cho khớp file package.

## Nguyên tắc

1. **Màu & theme**: chỉnh palette tập trung tại `packages/ui/src/styles/globals.css` (`:root` / `.dark`). Storefront dùng class semantic: `bg-background`, `text-foreground`, `primary`, `secondary`, `muted`, `card`, `border`, `surface-*`, `outline-*`, `brand-navy`, `brand-burgundy`, … — **tránh** hardcode `zinc-*` / màu lạ nếu đã có token.
2. **Gradient / nhấn mạnh hero**: dùng `from-primary to-gradient-hero-end` (đuôi gradient burgundy / rose theo theme hub-parent).
3. **Khả năng tiếp cận**: layout gốc có link “Bỏ qua đến nội dung chính” và `#main-content` trên `<main>`; giữ heading có thứ tự hợp lý trên landing.
4. **Branding người dùng**: copy hiển thị **Hub B2B** (template hub-parent). Không đổi tên hàm SDK / key storage kỹ thuật (`createStoreSyncSdk`, `storesync_session`, …) nếu không có migration backend.

## Tham chiếu nhanh

- Shell layout: `apps/frontend/src/app/layout.tsx`
- Landing: `apps/frontend/src/app/page.tsx`
- Header / footer: `apps/frontend/src/components/shared/header.tsx`, `footer.tsx`
