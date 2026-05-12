import { PERMISSION_CODES } from "@workspace/api-client";

/** Nhãn tiếng Việt cho UI (hồ sơ, ma trận RBAC). */
export const PERMISSION_LABEL_VI: Record<string, string> = {
  [PERMISSION_CODES.ALL]: "Toàn quyền (*)",
  [PERMISSION_CODES.PRODUCTS_READ]: "Xem sản phẩm / kho",
  [PERMISSION_CODES.PRODUCTS_WRITE]: "Sửa sản phẩm & tồn kho",
  [PERMISSION_CODES.CATEGORIES_READ]: "Xem loại SP",
  [PERMISSION_CODES.CATEGORIES_WRITE]: "Sửa loại SP",
  [PERMISSION_CODES.ORDERS_READ]: "Xem đơn hàng",
  [PERMISSION_CODES.ORDERS_WRITE]: "Xử lý đơn (xuất kho, giao, huỷ)",
  [PERMISSION_CODES.ORDERS_CHECKOUT]: "Đặt hàng (checkout)",
  [PERMISSION_CODES.USERS_MANAGE]: "Quản lý nhân sự & tài khoản",
  [PERMISSION_CODES.USERS_CART_OWN]: "Giỏ hàng của chính mình",
  [PERMISSION_CODES.RBAC_READ]: "Xem vai trò & quyền",
  [PERMISSION_CODES.DATA_MAINTENANCE]: "Sao lưu / bảo trì dữ liệu",
  [PERMISSION_CODES.SUPPORT_READ]: "Xem trang hỗ trợ đại lý (hotline / Zalo)",
  [PERMISSION_CODES.SUPPORT_WRITE]: "Sửa nội dung hỗ trợ đại lý trên cửa hàng",
};

export function permissionLabelVi(code: string): string {
  return PERMISSION_LABEL_VI[code] ?? code;
}
