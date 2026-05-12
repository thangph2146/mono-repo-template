export const APP_HEADERS = {
  USER_ID: 'x-user-id',
  VIEW_ALL: 'x-view-all',
} as const;

export const AUTH_ROLE_NAMES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type AuthRoleName =
  (typeof AUTH_ROLE_NAMES)[keyof typeof AUTH_ROLE_NAMES];

export const ADMIN_ROUTES = {
  BASE: 'admin',
  ACCOUNTS: 'admin/accounts',
  ADMISSION_RESULTS: 'admin/admission-results',
  AUTH: 'auth/admin',
  CATEGORIES: 'admin/categories',
  COMMENTS: 'admin/comments',
  CONTACT_REQUESTS: 'admin/contact-requests',
  DASHBOARD: 'admin/dashboard',
  GROUPS: 'admin/groups',
  MESSAGES: 'admin/messages',
  CONVERSATIONS: 'admin/conversations',
  NOTIFICATIONS: 'admin/notifications',
  PAGE_CONTENTS: 'admin/page-contents',
  POSTS: 'admin/posts',
  ROLES: 'admin/roles',
  SESSIONS: 'admin/sessions',
  SETTINGS: 'admin/settings',
  STUDENTS: 'admin/students',
  TAGS: 'admin/tags',
  UPLOADS: 'admin/uploads',
  USERS: 'admin/users',
  SYSTEM: 'admin/system',
  UNREAD_COUNTS: 'admin/unread-counts',
  PROXY_IMAGE: 'admin/proxy-image',
} as const;

export const PUBLIC_ROUTES = {
  BASE: 'public',
  CATEGORIES: 'public/categories',
  CONTACT_REQUESTS: 'public/contact-requests',
  POSTS: 'public/posts',
  HOME_ADMISSION_POSTS: 'public/home-admission-posts',
  PAGE_CONTENTS: 'public/page-contents',
  ADMISSION_RESULTS_LOOKUP: 'public/admission-results/lookup',
  UPLOADS: 'public/uploads',
  SERVE_UPLOADS: 'uploads',
} as const;
