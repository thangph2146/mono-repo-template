import {
  Collection,
  Entity,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { RolePermissionLink } from './role-permission-link.entity';
import { UserRoleLink } from './user-role-link.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
  @Property()
  @Unique()
  code!: string;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermissionLink, (link) => link.role)
  permissionLinks = new Collection<RolePermissionLink>(this);

  @OneToMany(() => UserRoleLink, (link) => link.role)
  userLinks = new Collection<UserRoleLink>(this);
}
