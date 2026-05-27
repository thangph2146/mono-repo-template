export type { RbacPermission, RbacRole } from "@workspace/api-client";

export const PERMISSION_GROUPS = [
  "users",
  "posts",
  "categories",
  "tags",
  "guides",
  "media",
  "settings",
] as const;

export type CreateRoleInput = {
  code: string;
  name: string;
  displayName: string;
  description?: string | null;
  permissionCodes: string[];
};

export type UpdateRoleInput = Partial<Omit<CreateRoleInput, "code">>;
