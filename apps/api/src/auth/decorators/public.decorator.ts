import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'rbac_public';
/** Đánh dấu route không cần X-User-Id / kiểm tra quyền. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = 'rbac_permissions';
/** Yêu cầu user có đủ mọi mã quyền liệt kê (AND). */
export const RequirePermissions = (...codes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, codes);

export const Permissions = RequirePermissions;
