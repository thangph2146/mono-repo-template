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
  [PERMISSION_CODES.CONTACT_REQUESTS_VIEW]: "Xem liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_CREATE]: "Tạo liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_UPDATE]: "Cập nhật liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_DELETE]: "Xóa liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_MANAGE]: "Quản lý liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_EXPORT]: "Xuất liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_ASSIGN]: "Phân công liên hệ hỗ trợ",
  [PERMISSION_CODES.CONTACT_REQUESTS_RESTORE]: "Khôi phục liên hệ hỗ trợ",
};

const RESOURCE_LABEL_VI: Record<string, string> = {
  accounts: "tài khoản",
  admission_results: "kết quả trúng tuyển",
  posts: "bài viết",
  comments: "bình luận",
  settings: "cài đặt",
  categories: "danh mục",
  dashboard: "bảng điều khiển",
  groups: "nhóm",
  contact_requests: "liên hệ hỗ trợ",
  users: "người dùng",
  page_contents: "nội dung trang",
  sessions: "phiên đăng nhập",
  students: "sinh viên",
  tags: "thẻ",
  notifications: "thông báo",
  messages: "tin nhắn",
  uploads: "tệp tải lên",
  roles: "vai trò",
};

const ACTION_LABEL_VI: Record<string, string> = {
  view: "Xem",
  view_all: "Xem tất cả",
  view_own: "Xem của mình",
  manage: "Quản lý",
  update: "Cập nhật",
  export: "Xuất",
  import: "Nhập",
  restore: "Khôi phục",
  create: "Tạo mới",
  delete: "Xóa",
  publish: "Xuất bản",
  approve: "Phê duyệt",
  assign: "Phân công",
  active: "Kích hoạt",
  unactive: "Vô hiệu hóa",
  "hard-delete": "Xóa vĩnh viễn",
  "revoke-by-user": "Thu hồi theo người dùng",
};

function titleCaseToken(token: string): string {
  return token
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDynamicPermissionLabel(code: string): string {
  const [resourceRaw, actionRaw] = code.split(":");
  if (!resourceRaw || !actionRaw) {
    return code
      .split(/[:._-]+/)
      .filter(Boolean)
      .map(titleCaseToken)
      .join(" / ");
  }

  const resourceLabel =
    RESOURCE_LABEL_VI[resourceRaw] ?? titleCaseToken(resourceRaw).toLowerCase();
  const actionLabel =
    ACTION_LABEL_VI[actionRaw] ?? titleCaseToken(actionRaw);

  return `${actionLabel} ${resourceLabel}`;
}

export function permissionLabelVi(code: string): string {
  return PERMISSION_LABEL_VI[code] ?? buildDynamicPermissionLabel(code);
}
