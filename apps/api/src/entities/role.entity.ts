import { Entity, Property, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { UserRole } from './user-role.entity';

@Entity({ tableName: 'roles' })
export class Role extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property()
  displayName!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ type: 'json', nullable: true })
  permissions?: unknown;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];
}
