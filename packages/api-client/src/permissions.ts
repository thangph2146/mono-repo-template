/**
 * Mã quyền khớp `apps/api/src/config/permissions.ts` — dùng cho UI (ẩn menu, v.v.).
 * Format: `resource:action` (vd: `users:view`, `posts:create`).
 */
import type { AuthUser } from "./types";

export const PERMISSION_CODES = {
  ALL: "*",

  // ─── Dashboard ───
  DASHBOARD_VIEW: "dashboard:view",

  // ─── Users ───
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",
  USERS_EXPORT: "users:export",
  USERS_IMPORT: "users:import",
  USERS_RESTORE: "users:restore",
  USERS_HARD_DELETE: "users:hard-delete",
  USERS_ACTIVE: "users:active",
  USERS_UNACTIVE: "users:unactive",

  // ─── Posts ───
  POSTS_VIEW: "posts:view",
  POSTS_VIEW_ALL: "posts:view_all",
  POSTS_VIEW_OWN: "posts:view_own",
  POSTS_CREATE: "posts:create",
  POSTS_UPDATE: "posts:update",
  POSTS_DELETE: "posts:delete",
  POSTS_MANAGE: "posts:manage",
  POSTS_EXPORT: "posts:export",
  POSTS_PUBLISH: "posts:publish",
  POSTS_IMPORT: "posts:import",
  POSTS_RESTORE: "posts:restore",

  // ─── Categories ───
  CATEGORIES_VIEW: "categories:view",
  CATEGORIES_CREATE: "categories:create",
  CATEGORIES_UPDATE: "categories:update",
  CATEGORIES_DELETE: "categories:delete",
  CATEGORIES_MANAGE: "categories:manage",
  CATEGORIES_EXPORT: "categories:export",

  // ─── Tags ───
  TAGS_VIEW: "tags:view",
  TAGS_CREATE: "tags:create",
  TAGS_UPDATE: "tags:update",
  TAGS_DELETE: "tags:delete",
  TAGS_MANAGE: "tags:manage",
  TAGS_EXPORT: "tags:export",

  // ─── Comments ───
  COMMENTS_VIEW: "comments:view",
  COMMENTS_CREATE: "comments:create",
  COMMENTS_UPDATE: "comments:update",
  COMMENTS_DELETE: "comments:delete",
  COMMENTS_MANAGE: "comments:manage",
  COMMENTS_EXPORT: "comments:export",
  COMMENTS_APPROVE: "comments:approve",
  COMMENTS_RESTORE: "comments:restore",

  // ─── Roles ───
  ROLES_VIEW: "roles:view",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_MANAGE: "roles:manage",
  ROLES_EXPORT: "roles:export",

  // ─── Messages ───
  MESSAGES_VIEW: "messages:view",
  MESSAGES_VIEW_OWN: "messages:view_own",
  MESSAGES_CREATE: "messages:create",
  MESSAGES_UPDATE: "messages:update",
  MESSAGES_DELETE: "messages:delete",
  MESSAGES_MANAGE: "messages:manage",
  MESSAGES_EXPORT: "messages:export",

  // ─── Groups ───
  GROUPS_VIEW: "groups:view",
  GROUPS_CREATE: "groups:create",
  GROUPS_UPDATE: "groups:update",
  GROUPS_DELETE: "groups:delete",
  GROUPS_MANAGE: "groups:manage",
  GROUPS_EXPORT: "groups:export",

  // ─── Notifications ───
  NOTIFICATIONS_VIEW: "notifications:view",
  NOTIFICATIONS_VIEW_ALL: "notifications:view_all",
  NOTIFICATIONS_VIEW_OWN: "notifications:view_own",
  NOTIFICATIONS_MANAGE: "notifications:manage",
  NOTIFICATIONS_EXPORT: "notifications:export",

  // ─── Contact Requests ───
  CONTACT_REQUESTS_VIEW: "contact_requests:view",
  CONTACT_REQUESTS_CREATE: "contact_requests:create",
  CONTACT_REQUESTS_UPDATE: "contact_requests:update",
  CONTACT_REQUESTS_DELETE: "contact_requests:delete",
  CONTACT_REQUESTS_MANAGE: "contact_requests:manage",
  CONTACT_REQUESTS_EXPORT: "contact_requests:export",
  CONTACT_REQUESTS_ASSIGN: "contact_requests:assign",
  CONTACT_REQUESTS_RESTORE: "contact_requests:restore",

  // ─── Students ───
  STUDENTS_VIEW: "students:view",
  STUDENTS_VIEW_ALL: "students:view_all",
  STUDENTS_VIEW_OWN: "students:view_own",
  STUDENTS_CREATE: "students:create",
  STUDENTS_UPDATE: "students:update",
  STUDENTS_DELETE: "students:delete",
  STUDENTS_MANAGE: "students:manage",
  STUDENTS_EXPORT: "students:export",
  STUDENTS_ACTIVE: "students:active",
  STUDENTS_IMPORT: "students:import",
  STUDENTS_RESTORE: "students:restore",

  // ─── Sessions ───
  SESSIONS_VIEW: "sessions:view",
  SESSIONS_CREATE: "sessions:create",
  SESSIONS_UPDATE: "sessions:update",
  SESSIONS_DELETE: "sessions:delete",
  SESSIONS_MANAGE: "sessions:manage",
  SESSIONS_EXPORT: "sessions:export",
  SESSIONS_RESTORE: "sessions:restore",

  // ─── Settings ───
  SETTINGS_VIEW: "settings:view",
  SETTINGS_CREATE: "settings:create",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_DELETE: "settings:delete",
  SETTINGS_MANAGE: "settings:manage",
  SETTINGS_EXPORT: "settings:export",
  SETTINGS_IMPORT: "settings:import",

  // ─── Accounts (profile) ───
  ACCOUNTS_VIEW: "accounts:view",
  ACCOUNTS_UPDATE: "accounts:update",
  ACCOUNTS_MANAGE: "accounts:manage",

  // ─── Uploads ───
  UPLOADS_VIEW: "uploads:view",
  UPLOADS_CREATE: "uploads:create",
  UPLOADS_UPDATE: "uploads:update",
  UPLOADS_DELETE: "uploads:delete",
  UPLOADS_MANAGE: "uploads:manage",
  UPLOADS_EXPORT: "uploads:export",

  // ─── Admission Results ───
  ADMISSION_RESULTS_VIEW: "admission_results:view",
  ADMISSION_RESULTS_CREATE: "admission_results:create",
  ADMISSION_RESULTS_UPDATE: "admission_results:update",
  ADMISSION_RESULTS_DELETE: "admission_results:delete",
  ADMISSION_RESULTS_MANAGE: "admission_results:manage",
  ADMISSION_RESULTS_EXPORT: "admission_results:export",
  ADMISSION_RESULTS_IMPORT: "admission_results:import",
  ADMISSION_RESULTS_RESTORE: "admission_results:restore",

  // ─── Page Contents ───
  PAGE_CONTENTS_VIEW: "page_contents:view",
  PAGE_CONTENTS_CREATE: "page_contents:create",
  PAGE_CONTENTS_UPDATE: "page_contents:update",
  PAGE_CONTENTS_DELETE: "page_contents:delete",
  PAGE_CONTENTS_MANAGE: "page_contents:manage",
  PAGE_CONTENTS_EXPORT: "page_contents:export",

  // ─── Frontend-specific Resources (chưa có trong API permissions) ───
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

  // ─── SEO Metas ───
  SEO_METAS_VIEW: "seo_metas:view",
  SEO_METAS_CREATE: "seo_metas:create",
  SEO_METAS_UPDATE: "seo_metas:update",
  SEO_METAS_DELETE: "seo_metas:delete",
  SEO_METAS_MANAGE: "seo_metas:manage",
  SEO_METAS_EXPORT: "seo_metas:export",
  SEO_METAS_RESTORE: "seo_metas:restore",
  SEO_METAS_HARD_DELETE: "seo_metas:hard-delete",

  // ─── Legacy (shop/frontend, format dot-notation) ───
  /** @deprecated Dùng PRODUCTS_VIEW, PRODUCTS_WRITE từ API khi có */
  PRODUCTS_READ: "products.read",
  /** @deprecated */
  PRODUCTS_WRITE: "products.write",
  /** @deprecated */
  ORDERS_READ: "orders.read",
  /** @deprecated */
  ORDERS_WRITE: "orders.write",
  /** @deprecated */
  ORDERS_CHECKOUT: "orders.checkout",
  /** @deprecated Dùng USERS_MANAGE */
  USERS_CART_OWN: "users.cart_own",
  /** @deprecated Dùng ROLES_VIEW */
  RBAC_READ: "rbac.read",
  /** @deprecated Dùng SETTINGS_MANAGE */
  DATA_MAINTENANCE: "data.maintenance",
  /** @deprecated Support cho frontend shop */
  SUPPORT_READ: "support.read",
  /** @deprecated */
  SUPPORT_WRITE: "support.write",
  /** @deprecated Dùng CATEGORIES_VIEW */
  CATEGORIES_READ: "categories.read",
  /** @deprecated Dùng CATEGORIES_CREATE hoặc CATEGORIES_UPDATE */
  CATEGORIES_WRITE: "categories.write",
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
  "student",
] as const;

/** Quyền “vận hành” — nếu có (kể cả role lạ trong DB) vẫn coi là nội bộ. */
const STAFF_PANEL_PERMISSION_CODES: PermissionCode[] = [
  PERMISSION_CODES.USERS_MANAGE,
  PERMISSION_CODES.ROLES_VIEW,
  PERMISSION_CODES.SETTINGS_MANAGE,
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
