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
