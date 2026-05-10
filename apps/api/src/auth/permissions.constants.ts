/**
 * Mã quyền gắn với route / nghiệp vụ — seed & guard dùng cùng chuỗi.
 * Người dùng có nhiều role → hợp quyền = union tất cả permission của các role.
 */
export const PERMISSIONS = {
  /** Toàn quyền (chỉ gán cho role siêu quản trị). */
  ALL: '*',
  PRODUCTS_READ: 'products.read',
  PRODUCTS_WRITE: 'products.write',
  CATEGORIES_READ: 'categories.read',
  CATEGORIES_WRITE: 'categories.write',
  ORDERS_READ: 'orders.read',
  ORDERS_WRITE: 'orders.write',
  /** Đặt hàng từ storefront (POST /orders). */
  ORDERS_CHECKOUT: 'orders.checkout',
  USERS_MANAGE: 'users.manage',
  /** Đọc/ghi giỏ khi X-User-Id trùng id trong URL. */
  USERS_CART_OWN: 'users.cart_own',
  RBAC_READ: 'rbac.read',
  DATA_MAINTENANCE: 'data.maintenance',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_SEED_PERMISSION_CODES: readonly PermissionCode[] = [
  PERMISSIONS.ALL,
  PERMISSIONS.PRODUCTS_READ,
  PERMISSIONS.PRODUCTS_WRITE,
  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.CATEGORIES_WRITE,
  PERMISSIONS.ORDERS_READ,
  PERMISSIONS.ORDERS_WRITE,
  PERMISSIONS.ORDERS_CHECKOUT,
  PERMISSIONS.USERS_MANAGE,
  PERMISSIONS.USERS_CART_OWN,
  PERMISSIONS.RBAC_READ,
  PERMISSIONS.DATA_MAINTENANCE,
];
