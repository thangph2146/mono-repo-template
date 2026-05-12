/**
 * Permission System Configuration
 * Defines resources, actions, and the full set of permissions for the API.
 * This should be kept in sync with the admin panel's permission definitions.
 */

// Resource types
export const RESOURCES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  POSTS: 'posts',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  COMMENTS: 'comments',
  ROLES: 'roles',
  MESSAGES: 'messages',
  GROUPS: 'groups',
  NOTIFICATIONS: 'notifications',
  CONTACT_REQUESTS: 'contact_requests',
  STUDENTS: 'students',
  SESSIONS: 'sessions',
  SETTINGS: 'settings',
  ACCOUNTS: 'accounts',
  UPLOADS: 'uploads',
  ADMISSION_RESULTS: 'admission_results',
  PAGE_CONTENTS: 'page_contents',
} as const;

// Action types
export const ACTIONS = {
  VIEW: 'view',
  VIEW_ALL: 'view_all',
  VIEW_OWN: 'view_own',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  APPROVE: 'approve',
  ASSIGN: 'assign',
  ACTIVE: 'active',
  MANAGE: 'manage',
  EXPORT: 'export',
  IMPORT: 'import',
  RESTORE: 'restore',
  HARD_DELETE: 'hard-delete',
  UNACTIVE: 'unactive',
  REVOKE_BY_USER: 'revoke-by-user',
} as const;

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
export type Permission = `${Resource}:${Action}`;

/**
 * Helper function to generate standardized permissions for a resource.
 */
function generateResourcePermissions<T extends string>(resource: T) {
  const prefix = resource.toUpperCase() as Uppercase<T>;
  return {
    [`${prefix}_VIEW`]: `${resource}:${ACTIONS.VIEW}` as Permission,
    [`${prefix}_CREATE`]: `${resource}:${ACTIONS.CREATE}` as Permission,
    [`${prefix}_UPDATE`]: `${resource}:${ACTIONS.UPDATE}` as Permission,
    [`${prefix}_DELETE`]: `${resource}:${ACTIONS.DELETE}` as Permission,
    [`${prefix}_MANAGE`]: `${resource}:${ACTIONS.MANAGE}` as Permission,
    [`${prefix}_EXPORT`]: `${resource}:${ACTIONS.EXPORT}` as Permission,
  } as {
    [K in
      | 'VIEW'
      | 'CREATE'
      | 'UPDATE'
      | 'DELETE'
      | 'MANAGE'
      | 'EXPORT' as `${Uppercase<T>}_${K}`]: Permission;
  };
}

// Centralized Permissions List
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: `${RESOURCES.DASHBOARD}:${ACTIONS.VIEW}` as Permission,

  // Users
  ...generateResourcePermissions(RESOURCES.USERS),
  USERS_IMPORT: `${RESOURCES.USERS}:${ACTIONS.IMPORT}` as Permission,
  USERS_RESTORE: `${RESOURCES.USERS}:${ACTIONS.RESTORE}` as Permission,
  USERS_HARD_DELETE: `${RESOURCES.USERS}:${ACTIONS.HARD_DELETE}` as Permission,
  USERS_ACTIVE: `${RESOURCES.USERS}:${ACTIONS.ACTIVE}` as Permission,
  USERS_UNACTIVE: `${RESOURCES.USERS}:${ACTIONS.UNACTIVE}` as Permission,

  // Posts
  ...generateResourcePermissions(RESOURCES.POSTS),
  POSTS_VIEW_ALL: `${RESOURCES.POSTS}:${ACTIONS.VIEW_ALL}` as Permission,
  POSTS_VIEW_OWN: `${RESOURCES.POSTS}:${ACTIONS.VIEW_OWN}` as Permission,
  POSTS_PUBLISH: `${RESOURCES.POSTS}:${ACTIONS.PUBLISH}` as Permission,
  POSTS_IMPORT: `${RESOURCES.POSTS}:${ACTIONS.IMPORT}` as Permission,
  POSTS_RESTORE: `${RESOURCES.POSTS}:${ACTIONS.RESTORE}` as Permission,

  // Categories
  ...generateResourcePermissions(RESOURCES.CATEGORIES),

  // Tags
  ...generateResourcePermissions(RESOURCES.TAGS),

  // Comments
  ...generateResourcePermissions(RESOURCES.COMMENTS),
  COMMENTS_APPROVE: `${RESOURCES.COMMENTS}:${ACTIONS.APPROVE}` as Permission,
  COMMENTS_RESTORE: `${RESOURCES.COMMENTS}:${ACTIONS.RESTORE}` as Permission,

  // Roles
  ...generateResourcePermissions(RESOURCES.ROLES),

  // Messages
  ...generateResourcePermissions(RESOURCES.MESSAGES),

  // Groups
  ...generateResourcePermissions(RESOURCES.GROUPS),

  // Notifications
  NOTIFICATIONS_VIEW:
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.VIEW}` as Permission,
  NOTIFICATIONS_VIEW_ALL:
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.VIEW_ALL}` as Permission,
  NOTIFICATIONS_VIEW_OWN:
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.VIEW_OWN}` as Permission,
  NOTIFICATIONS_MANAGE:
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.MANAGE}` as Permission,
  NOTIFICATIONS_EXPORT:
    `${RESOURCES.NOTIFICATIONS}:${ACTIONS.EXPORT}` as Permission,

  // Contact Requests
  ...generateResourcePermissions(RESOURCES.CONTACT_REQUESTS),
  CONTACT_REQUESTS_ASSIGN:
    `${RESOURCES.CONTACT_REQUESTS}:${ACTIONS.ASSIGN}` as Permission,
  CONTACT_REQUESTS_RESTORE:
    `${RESOURCES.CONTACT_REQUESTS}:${ACTIONS.RESTORE}` as Permission,

  // Students
  ...generateResourcePermissions(RESOURCES.STUDENTS),
  STUDENTS_VIEW_ALL: `${RESOURCES.STUDENTS}:${ACTIONS.VIEW_ALL}` as Permission,
  STUDENTS_VIEW_OWN: `${RESOURCES.STUDENTS}:${ACTIONS.VIEW_OWN}` as Permission,
  STUDENTS_ACTIVE: `${RESOURCES.STUDENTS}:${ACTIONS.ACTIVE}` as Permission,
  STUDENTS_IMPORT: `${RESOURCES.STUDENTS}:${ACTIONS.IMPORT}` as Permission,
  STUDENTS_RESTORE: `${RESOURCES.STUDENTS}:${ACTIONS.RESTORE}` as Permission,

  // Sessions
  ...generateResourcePermissions(RESOURCES.SESSIONS),
  SESSIONS_RESTORE: `${RESOURCES.SESSIONS}:${ACTIONS.RESTORE}` as Permission,

  // Settings
  SETTINGS_VIEW: `${RESOURCES.SETTINGS}:${ACTIONS.VIEW}` as Permission,
  SETTINGS_CREATE: `${RESOURCES.SETTINGS}:${ACTIONS.CREATE}` as Permission,
  SETTINGS_UPDATE: `${RESOURCES.SETTINGS}:${ACTIONS.UPDATE}` as Permission,
  SETTINGS_DELETE: `${RESOURCES.SETTINGS}:${ACTIONS.DELETE}` as Permission,
  SETTINGS_MANAGE: `${RESOURCES.SETTINGS}:${ACTIONS.MANAGE}` as Permission,
  SETTINGS_EXPORT: `${RESOURCES.SETTINGS}:${ACTIONS.EXPORT}` as Permission,
  SETTINGS_IMPORT: `${RESOURCES.SETTINGS}:${ACTIONS.IMPORT}` as Permission,

  // Accounts
  ACCOUNTS_VIEW: `${RESOURCES.ACCOUNTS}:${ACTIONS.VIEW}` as Permission,
  ACCOUNTS_UPDATE: `${RESOURCES.ACCOUNTS}:${ACTIONS.UPDATE}` as Permission,
  ACCOUNTS_MANAGE: `${RESOURCES.ACCOUNTS}:${ACTIONS.MANAGE}` as Permission,

  // Uploads
  ...generateResourcePermissions(RESOURCES.UPLOADS),

  // Admission Results
  ...generateResourcePermissions(RESOURCES.ADMISSION_RESULTS),
  ADMISSION_RESULTS_IMPORT:
    `${RESOURCES.ADMISSION_RESULTS}:${ACTIONS.IMPORT}` as Permission,
  ADMISSION_RESULTS_RESTORE:
    `${RESOURCES.ADMISSION_RESULTS}:${ACTIONS.RESTORE}` as Permission,

  // Page Contents
  PAGE_CONTENTS_VIEW:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.VIEW}` as Permission,
  PAGE_CONTENTS_CREATE:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.CREATE}` as Permission,
  PAGE_CONTENTS_UPDATE:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.UPDATE}` as Permission,
  PAGE_CONTENTS_DELETE:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.DELETE}` as Permission,
  PAGE_CONTENTS_MANAGE:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.MANAGE}` as Permission,
  PAGE_CONTENTS_EXPORT:
    `${RESOURCES.PAGE_CONTENTS}:${ACTIONS.EXPORT}` as Permission,
} as const;
