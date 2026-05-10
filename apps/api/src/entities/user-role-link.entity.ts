import { Entity, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity({ tableName: 'users_roles' })
@Unique({ properties: ['user', 'role'] })
export class UserRoleLink extends BaseEntity {
  @ManyToOne(() => User, { inversedBy: 'userRoleLinks' })
  user!: User;

  @ManyToOne(() => Role, { inversedBy: 'userLinks' })
  role!: Role;
}
