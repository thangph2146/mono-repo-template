import { Entity, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity({ tableName: 'roles_permissions' })
@Unique({ properties: ['role', 'permission'] })
export class RolePermissionLink extends BaseEntity {
  @ManyToOne(() => Role, { fieldName: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, { fieldName: 'permission_id' })
  permission!: Permission;
}
