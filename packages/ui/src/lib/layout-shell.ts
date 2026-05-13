/**
 * Chuẩn vỏ trang + max-width dùng chung giữa storefront và admin.
 * Giữ chuỗi Tailwind literal để @source trong globals.css quét đủ class.
 */

/** Khớp scale `max-w-*` / prop `max` của `<Container />`. */
export type ContainerMaxWidth =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "full";

export function containerMaxWidthClass(max: ContainerMaxWidth): string {
  switch (max) {
    case "sm":
      return "max-w-sm";
    case "md":
      return "max-w-md";
    case "lg":
      return "max-w-lg";
    case "xl":
      return "max-w-xl";
    case "2xl":
      return "max-w-2xl";
    case "3xl":
      return "max-w-3xl";
    case "4xl":
      return "max-w-4xl";
    case "5xl":
      return "max-w-5xl";
    case "6xl":
      return "max-w-6xl";
    case "7xl":
      return "max-w-7xl";
    case "8xl":
      return "max-w-[1440px]";
    case "full":
      return "max-w-full";
    default: {
      const _exhaustive: never = max;
      return _exhaustive;
    }
  }
}

/** Giá trị `max` mặc định cho nội dung store (catalog, cart, …). */
export const STORE_CONTAINER_MAX_DEFAULT = "8xl" satisfies ContainerMaxWidth;

/** Giá trị `max` form đăng nhập đại lý. */
export const STORE_CONTAINER_MAX_AUTH = "xl" satisfies ContainerMaxWidth;

/** Giá trị `max` form đăng ký (rộng hơn). */
export const STORE_CONTAINER_MAX_REGISTER = "2xl" satisfies ContainerMaxWidth;

/** Padding ngang trong `<Container />` — hầu hết trang (store-sync). */
export const STORE_CONTAINER_INSET = "px-4 md:px-8";

/** Padding ngang marketing trang chủ (rộng hơn). */
export const STORE_CONTAINER_INSET_WIDE = "px-6 md:px-12";

/** Vỏ `<PageContent />` chuẩn cho khu (store-sync): full-bleed ngang, padding dọc. */
export const STORE_PAGE_CONTENT_CLASS = "space-y-0 px-0 py-8 md:px-0 md:py-10";

/** Trang landing: gỡ padding mặc định của PageContent. */
export const STORE_LANDING_PAGE_CONTENT_CLASS = "space-y-0 p-0 md:p-0";

/** Trang chờ / đăng nhập — căn giữa khối. */
export const STORE_PAGE_CONTENT_CENTER_CLASS =
  "grid min-h-[50vh] place-items-center px-0 py-8 md:px-0 md:py-10";

/** Catalog / trạng thái rỗng — khối center thấp hơn. */
export const STORE_PAGE_CONTENT_EMPTY_CLASS =
  "grid min-h-[40vh] place-items-center px-0 py-16";

/** Khối intro tiêu đề (support, hero phụ). */
export const STORE_INTRO_COLUMN_CLASS = "mx-auto max-w-3xl space-y-3 text-center";

/** Khối đăng nhập admin — responsive max-width chuẩn Tailwind. */
export const ADMIN_AUTH_PANEL_CLASS =
  "w-full min-w-0 max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl rounded-lg border border-border bg-card p-6 sm:p-8 shadow-sm";

/** Card thông tin (vd. /register admin) — cùng scale max-width. */
export const ADMIN_AUTH_INFO_CARD_CLASS =
  "w-full min-w-0 max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl rounded-lg border border-border shadow-sm";

// ── Vỏ app admin (apps/backend) ─────────────────────────────

/** `<main>` trong AdminShell — cuộn + nền + padding nội dung. */
export const ADMIN_MAIN_SCROLL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/20 p-4 sm:p-6";

/** Vỏ `<PageContent />` trong admin: `<main>` đã có padding — bỏ padding storefront. */
export const ADMIN_PAGE_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col gap-0 space-y-0 p-0 sm:p-0 md:p-0 lg:p-0";

/** Sheet menu mobile admin. */
export const ADMIN_SHEET_NAV_CLASS =
  "flex w-[min(100vw,20rem)] flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-sm";

/** Dòng phụ vai trò dưới tên user (header). */
export const ADMIN_HEADER_ROLE_LINE_CLASS =
  "mt-1 max-w-[220px] truncate text-xs text-muted-foreground";

/** H1 tiêu đề trang module (icon + text), dùng chung admin. */
export const ADMIN_PAGE_TITLE_PRIMARY_CLASS =
  "flex items-center gap-3 text-4xl font-extrabold tracking-tight text-foreground";

/** H1 gọn hơn (vd. trang phụ / banner không quyền đọc). */
export const ADMIN_PAGE_TITLE_COMPACT_CLASS =
  "flex items-center gap-3 text-3xl font-extrabold tracking-tight text-foreground";

/** H1 trong khối hẹp (vd. từ chối quyền trước khi vào layout đầy đủ). */
export const ADMIN_PAGE_TITLE_FORM_CLASS =
  "flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground";

/** H1 trang hồ sơ / cài đặt tài khoản. */
export const ADMIN_PAGE_TITLE_PROFILE_CLASS =
  "text-3xl font-bold tracking-tight text-foreground";

/** H1 màn đăng nhập / auth panel. */
export const ADMIN_PAGE_TITLE_AUTH_CLASS =
  "text-2xl font-bold tracking-tight text-foreground";

/** H1 kiểu tài liệu (vd. sao lưu dữ liệu). */
export const ADMIN_PAGE_TITLE_DOCUMENT_CLASS =
  "text-2xl font-bold tracking-tight text-foreground sm:text-3xl";

/** Icon Lucide cạnh H1 module (size-9). */
export const ADMIN_PAGE_TITLE_ICON_CLASS = "size-9 shrink-0 text-primary";

/** Icon Lucide cạnh H1 form / compact (size-7). */
export const ADMIN_PAGE_TITLE_ICON_SM_CLASS = "size-7 shrink-0 text-primary";

/** Icon cạnh H1 compact (text-3xl, vd. không quyền). */
export const ADMIN_PAGE_TITLE_ICON_MD_CLASS = "size-8 shrink-0 text-primary";

/** Tiêu đề phụ trang (subtitle) — màu phụ chuẩn shadcn, độ rộng đọc. */
export const ADMIN_PAGE_SUBTITLE_CLASS =
  "mt-1 max-w-3xl font-medium text-muted-foreground";

/** Đoạn dẫn dưới H1 (cỡ chữ lớn hơn subtitle) — dashboard, đơn hàng. */
export const ADMIN_PAGE_LEDE_CLASS =
  "mt-1 max-w-3xl text-lg font-medium text-muted-foreground";

/** Cột form / bảng phụ (vd. staff). */
export const ADMIN_PAGE_FORM_COLUMN_CLASS = "mx-auto max-w-3xl space-y-4";

export const ADMIN_DASHBOARD_EMPTY_INNER_CLASS =
  "mx-auto flex max-w-md flex-col items-center gap-3 text-center";

/** AlertDialog xác nhận (đơn hàng, kho, …) — đồng bộ border + max-width. */
export const ADMIN_ALERT_DIALOG_CONTENT_CLASS =
  "rounded-lg sm:max-w-[450px]";

/** Dialog form hẹp (500px). */
export const ADMIN_DIALOG_CONTENT_MD_CLASS =
  "rounded-lg sm:max-w-[500px]";

/** Dialog form rộng (3xl). */
export const ADMIN_DIALOG_CONTENT_LG_CLASS = "rounded-lg sm:max-w-3xl";

/** Dialog form danh mục. */
export const ADMIN_DIALOG_CONTENT_CATEGORY_CLASS = "max-w-[90vw] sm:max-w-[600px]";

/** Dialog toàn màn hình kho (bảng chi tiết). */
export const ADMIN_DIALOG_CONTENT_INVENTORY_FULL_CLASS =
  "flex-col gap-0 p-0 sm:max-w-7xl";
