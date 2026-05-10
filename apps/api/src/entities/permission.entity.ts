import { Collection, Entity, OneToMany, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { RolePermissionLink } from './role-permission-link.entity';

@Entity({ tableName: 'permissions' })
export class Permission extends BaseEntity {
  /** Mã quyền ổn định cho guard & seed (vd: `products.write`). */
  @Property()
  @Unique()
  code!: string;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @OneToMany(() => RolePermissionLink, (link) => link.permission)
  roleLinks = new Collection<RolePermissionLink>(this);
}
