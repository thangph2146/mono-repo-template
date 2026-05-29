export * from './types';
export type { ContactRequest, CreateContactRequestInput, UpdateContactRequestInput } from './resources/contact-requests';
export type { ParentStudent, AddStudentInput } from './resources/my-students';
export type { ParentStudent as ParentStudentAdmin, UpdateParentStudentInput } from './resources/parent-students';
export { effectiveLineUnitPrice } from './unit-pricing';
export {
  PERMISSION_CODES,
  STAFF_ADMIN_ROLE_CODES,
  hasPermission,
  canUserAccess,
  canAccessStaffAdmin,
  isSuperAdminRoleCode,
  type PermissionCode,
} from './permissions';
export { ApiClient, ApiError } from './client';
export type { ApiClientOptions, RequestOptions } from './client';
export { UsersApi } from './resources/users';
export { PostsApi } from './resources/posts';
export { CategoriesApi } from './resources/categories';
export { TagsApi } from './resources/tags';
export { GuidesApi } from './resources/guides';
export { RbacApi } from './resources/rbac';
export { ContactRequestsApi } from './resources/contact-requests';
export { MyStudentsApi } from './resources/my-students';
export { ParentStudentsApi } from './resources/parent-students';
export { SystemApi } from './resources/system';
export { SpeakersApi } from './resources/speakers';
export { LocationsApi } from './resources/locations';
export { TrainingLevelsApi } from './resources/training-levels';
export { TrainingSystemsApi } from './resources/training-systems';
export { MajorsApi } from './resources/majors';
export { CoursesApi } from './resources/courses';
export { AcademicYearsApi } from './resources/academic-years';
export { EventsApi } from './resources/events';
export { EventRegistrationsApi } from './resources/event-registrations';
export { EventCheckinsApi } from './resources/event-checkins';
export { EventSpeakersApi } from './resources/event-speakers';
export { FaceDataApi } from './resources/face-data';
export { CamerasApi } from './resources/cameras';
export { TemplatesApi } from './resources/templates';
export { ScreensApi } from './resources/screens';
export { DepartmentsApi } from './resources/departments';
export { StoreSyncSdk, createStoreSyncSdk, DEFAULT_API_URL } from './sdk';
export {
  unwrapApiEnvelope,
  normalizePagedResult,
  getData,
  postData,
  putData,
  deleteData,
} from './resources/_shared';
export {
  slugify,
  formatDateTime,
  buildCategoryOptionTree,
  type CategoryTreeNode,
  type PagedResult,
} from './utils';
