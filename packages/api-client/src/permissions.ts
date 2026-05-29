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
  CONTACT_REQUESTS_VIEW: "contact_requests:view",
  CONTACT_REQUESTS_CREATE: "contact_requests:create",
  CONTACT_REQUESTS_UPDATE: "contact_requests:update",
  CONTACT_REQUESTS_DELETE: "contact_requests:delete",
  CONTACT_REQUESTS_MANAGE: "contact_requests:manage",
  CONTACT_REQUESTS_EXPORT: "contact_requests:export",
  CONTACT_REQUESTS_ASSIGN: "contact_requests:assign",
  CONTACT_REQUESTS_RESTORE: "contact_requests:restore",
  TAGS_VIEW: "tags:view",
  TAGS_CREATE: "tags:create",
  TAGS_UPDATE: "tags:update",
  TAGS_DELETE: "tags:delete",
  TAGS_MANAGE: "tags:manage",
  TAGS_EXPORT: "tags:export",
  SPEAKERS_VIEW: "speakers:view",
  SPEAKERS_CREATE: "speakers:create",
  SPEAKERS_UPDATE: "speakers:update",
  SPEAKERS_DELETE: "speakers:delete",
  SPEAKERS_MANAGE: "speakers:manage",
  SPEAKERS_EXPORT: "speakers:export",
  LOCATIONS_VIEW: "locations:view",
  LOCATIONS_CREATE: "locations:create",
  LOCATIONS_UPDATE: "locations:update",
  LOCATIONS_DELETE: "locations:delete",
  LOCATIONS_MANAGE: "locations:manage",
  LOCATIONS_EXPORT: "locations:export",
  TRAINING_LEVELS_VIEW: "training_levels:view",
  TRAINING_LEVELS_CREATE: "training_levels:create",
  TRAINING_LEVELS_UPDATE: "training_levels:update",
  TRAINING_LEVELS_DELETE: "training_levels:delete",
  TRAINING_LEVELS_MANAGE: "training_levels:manage",
  TRAINING_LEVELS_EXPORT: "training_levels:export",
  TRAINING_SYSTEMS_VIEW: "training_systems:view",
  TRAINING_SYSTEMS_CREATE: "training_systems:create",
  TRAINING_SYSTEMS_UPDATE: "training_systems:update",
  TRAINING_SYSTEMS_DELETE: "training_systems:delete",
  TRAINING_SYSTEMS_MANAGE: "training_systems:manage",
  TRAINING_SYSTEMS_EXPORT: "training_systems:export",
  MAJORS_VIEW: "majors:view",
  MAJORS_CREATE: "majors:create",
  MAJORS_UPDATE: "majors:update",
  MAJORS_DELETE: "majors:delete",
  MAJORS_MANAGE: "majors:manage",
  MAJORS_EXPORT: "majors:export",
  COURSES_VIEW: "courses:view",
  COURSES_CREATE: "courses:create",
  COURSES_UPDATE: "courses:update",
  COURSES_DELETE: "courses:delete",
  COURSES_MANAGE: "courses:manage",
  COURSES_EXPORT: "courses:export",
  ACADEMIC_YEARS_VIEW: "academic_years:view",
  ACADEMIC_YEARS_CREATE: "academic_years:create",
  ACADEMIC_YEARS_UPDATE: "academic_years:update",
  ACADEMIC_YEARS_DELETE: "academic_years:delete",
  ACADEMIC_YEARS_MANAGE: "academic_years:manage",
  ACADEMIC_YEARS_EXPORT: "academic_years:export",
  PAGE_CONTENTS_VIEW: "page_contents:view",
  PAGE_CONTENTS_CREATE: "page_contents:create",
  PAGE_CONTENTS_UPDATE: "page_contents:update",
  PAGE_CONTENTS_DELETE: "page_contents:delete",
  PAGE_CONTENTS_MANAGE: "page_contents:manage",
  EVENTS_VIEW: "events:view",
  EVENTS_CREATE: "events:create",
  EVENTS_UPDATE: "events:update",
  EVENTS_DELETE: "events:delete",
  EVENTS_MANAGE: "events:manage",
  CAMERAS_VIEW: "cameras:view",
  CAMERAS_CREATE: "cameras:create",
  CAMERAS_UPDATE: "cameras:update",
  CAMERAS_DELETE: "cameras:delete",
  CAMERAS_MANAGE: "cameras:manage",
  TEMPLATES_VIEW: "templates:view",
  TEMPLATES_CREATE: "templates:create",
  TEMPLATES_UPDATE: "templates:update",
  TEMPLATES_DELETE: "templates:delete",
  TEMPLATES_MANAGE: "templates:manage",
  SCREENS_VIEW: "screens:view",
  SCREENS_CREATE: "screens:create",
  SCREENS_UPDATE: "screens:update",
  SCREENS_DELETE: "screens:delete",
  SCREENS_MANAGE: "screens:manage",
  DEPARTMENTS_VIEW: "departments:view",
  DEPARTMENTS_CREATE: "departments:create",
  DEPARTMENTS_UPDATE: "departments:update",
  DEPARTMENTS_DELETE: "departments:delete",
  DEPARTMENTS_MANAGE: "departments:manage",
  EVENT_REGISTRATIONS_VIEW: "event_registrations:view",
  EVENT_REGISTRATIONS_CREATE: "event_registrations:create",
  EVENT_REGISTRATIONS_UPDATE: "event_registrations:update",
  EVENT_REGISTRATIONS_DELETE: "event_registrations:delete",
  EVENT_REGISTRATIONS_MANAGE: "event_registrations:manage",
  EVENT_CHECKINS_VIEW: "event_checkins:view",
  EVENT_CHECKINS_CREATE: "event_checkins:create",
  EVENT_CHECKINS_UPDATE: "event_checkins:update",
  EVENT_CHECKINS_DELETE: "event_checkins:delete",
  EVENT_CHECKINS_MANAGE: "event_checkins:manage",
  EVENT_SPEAKERS_VIEW: "event_speakers:view",
  EVENT_SPEAKERS_CREATE: "event_speakers:create",
  EVENT_SPEAKERS_UPDATE: "event_speakers:update",
  EVENT_SPEAKERS_DELETE: "event_speakers:delete",
  EVENT_SPEAKERS_MANAGE: "event_speakers:manage",
  FACE_DATA_VIEW: "face_data:view",
  FACE_DATA_CREATE: "face_data:create",
  FACE_DATA_UPDATE: "face_data:update",
  FACE_DATA_DELETE: "face_data:delete",
  FACE_DATA_MANAGE: "face_data:manage",
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
  if (user.roles?.some((r) => isSuperAdminRoleCode(r.name))) {
    return true;
  }
  return hasPermission(user.permissions, code);
}

/**
 * Role nội bộ được seed trong API (không gồm `customer`).
 * Dùng để biết tài khoản có được vào HUB_ADMIN hay không.
 */
export const STAFF_ADMIN_ROLE_CODES = [
  "super_admin",
  "admin",
  "manager",
  "sales",
  "shipper",
  "parent",
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
  PERMISSION_CODES.CONTACT_REQUESTS_VIEW,
  PERMISSION_CODES.CONTACT_REQUESTS_MANAGE,
  PERMISSION_CODES.TAGS_VIEW,
  PERMISSION_CODES.TAGS_MANAGE,
];

/**
 * Cổng quản trị chỉ dành cho nội bộ. Khách/đại lý (`customer`) thường chỉ có
 * `*.read` + `orders.checkout` + `users.cart_own` — không đủ → chặn ở login/shell.
 */
export function canAccessStaffAdmin(user: AuthUser): boolean {
  if (user.roles?.some((r) => isSuperAdminRoleCode(r.name))) return true;
  const staffRoles = STAFF_ADMIN_ROLE_CODES as readonly string[];
  if (user.roles?.some((r) => staffRoles.includes(r.name))) return true;
  return STAFF_PANEL_PERMISSION_CODES.some((p) =>
    hasPermission(user.permissions, p),
  );
}
