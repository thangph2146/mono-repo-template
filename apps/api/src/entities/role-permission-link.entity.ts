import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity({ tableName: 'roles_permissions' })
@Unique({ properties: ['role', 'permission'] })
export class RolePermissionLink extends BaseEntity {
  @ManyToOne(() => Role)
  role!: Role;

  @ManyToOne(() => Permission)
  permission!: Permission;
}
