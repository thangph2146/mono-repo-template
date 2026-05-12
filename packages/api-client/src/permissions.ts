/**
 * Mã quyền khớp `apps/api/src/auth/permissions.constants.ts` — dùng cho UI (ẩn menu, v.v.).
 */
import type { AuthUser } from "./types";

export const PERMISSION_CODES = {
  ALL: "*",
  PRODUCTS_READ: "products.read",
  PRODUCTS_WRITE: "products.write",
  CATEGORIES_READ: "categories.read",
  CATEGORIES_WRITE: "categories.write",
  ORDERS_READ: "orders.read",
  ORDERS_WRITE: "orders.write",
  ORDERS_CHECKOUT: "orders.checkout",
  USERS_MANAGE: "users.manage",
  USERS_CART_OWN: "users.cart_own",
  RBAC_READ: "rbac.read",
  DATA_MAINTENANCE: "data.maintenance",
  /** Trang « Hỗ trợ đại lý » trên cổng admin. */
  SUPPORT_READ: "support.read",
  /** Sửa nội dung trang /support trên cửa hàng. */
  SUPPORT_WRITE: "support.write",
} as const;

export type PermissionCode =
  (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export function hasPermission(
  granted: readonly string[] | undefined,
  code: PermissionCode,
): boolean {
  if (!granted?.length) return false;
  if (granted.includes(PERMISSION_CODES.ALL)) return true;
  return granted.includes(code);
}

/** Role siêu quản trị (mã trong DB) — coi như toàn quyền dù payload quyền lệch. */
export function isSuperAdminRoleCode(code: string | undefined): boolean {
  return code?.trim().toLowerCase() === "super_admin";
}

/**
 * Kiểm tra quyền cho UI: `*`, hoặc role `super_admin`, hoặc mã cụ thể.
 * Dùng thay cho `hasPermission(user.permissions, …)` trên admin panel.
 */
export function canUserAccess(user: AuthUser, code: PermissionCode): boolean {
  if (user.roles?.some((r) => isSuperAdminRoleCode(r.code))) {
    return true;
  }
  return hasPermission(user.permissions, code);
}

/**
 * Role nội bộ được seed trong API (không gồm `customer`).
 * Dùng để biết tài khoản có được vào storesync-admin hay không.
 */
export const STAFF_ADMIN_ROLE_CODES = [
  "super_admin",
  "admin",
  "manager",
  "sales",
  "shipper",
] as const;

/** Quyền “vận hành” — nếu có (kể cả role lạ trong DB) vẫn coi là nội bộ. */
const STAFF_PANEL_PERMISSION_CODES: PermissionCode[] = [
  PERMISSION_CODES.PRODUCTS_WRITE,
  PERMISSION_CODES.CATEGORIES_WRITE,
  PERMISSION_CODES.ORDERS_WRITE,
  PERMISSION_CODES.USERS_MANAGE,
  PERMISSION_CODES.RBAC_READ,
  PERMISSION_CODES.DATA_MAINTENANCE,
  PERMISSION_CODES.SUPPORT_READ,
  PERMISSION_CODES.SUPPORT_WRITE,
];

/**
 * Cổng quản trị chỉ dành cho nội bộ. Khách/đại lý (`customer`) thường chỉ có
 * `*.read` + `orders.checkout` + `users.cart_own` — không đủ → chặn ở login/shell.
 */
export function canAccessStaffAdmin(user: AuthUser): boolean {
  if (user.roles?.some((r) => isSuperAdminRoleCode(r.code))) return true;
  const staffRoles = STAFF_ADMIN_ROLE_CODES as readonly string[];
  if (user.roles?.some((r) => staffRoles.includes(r.code))) return true;
  return STAFF_PANEL_PERMISSION_CODES.some((p) =>
    hasPermission(user.permissions, p),
  );
}
