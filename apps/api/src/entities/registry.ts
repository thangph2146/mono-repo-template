import type { EntityClass } from '@mikro-orm/core';
import { Category } from './category.entity';
import { Order } from './order.entity';
import { Permission } from './permission.entity';
import { Product } from './product.entity';
import { Role } from './role.entity';
import { RolePermissionLink } from './role-permission-link.entity';
import { User } from './user.entity';
import { UserRoleLink } from './user-role-link.entity';

/**
 * Các entity được ORM quản lý — backup/import dùng metadata (cột, FK) tự động.
 * Thứ tự: quyền → role → liên kết → user → user–role → nghiệp vụ.
 */
export const PERSISTENT_ENTITY_CLASSES = [
  Permission,
  Role,
  RolePermissionLink,
  User,
  UserRoleLink,
  Category,
  Product,
  Order,
] as const satisfies readonly EntityClass<object>[];
