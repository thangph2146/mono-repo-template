import {
  Collection,
  Entity,
  OneToMany,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { UserRoleLink } from './user-role-link.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property()
  @Unique()
  email!: string;

  @Property()
  password!: string;

  @Property()
  fullName!: string;

  @Property({ nullable: true })
  phone?: string;

  @Property({ type: 'text', nullable: true })
  address?: string;

  @Property({ default: true })
  isActive: boolean = true;

  /** JSON: `{ "lines": [...] }` — giỏ hàng đồng bộ theo tài khoản storefront */
  @Property({ type: 'text', nullable: true })
  cartJson?: string | null;

  @OneToMany(() => UserRoleLink, (link) => link.user, { orphanRemoval: true })
  userRoleLinks = new Collection<UserRoleLink>(this);

  /** Xóa tạm — không đăng nhập được khi có giá trị. */
  @Property({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;
}
