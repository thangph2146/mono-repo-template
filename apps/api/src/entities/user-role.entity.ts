import { Entity, ManyToOne, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity({ tableName: 'user_roles' })
@Unique({ properties: ['user', 'role'] })
export class UserRole extends BaseEntity {
  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;

  @ManyToOne(() => Role, {
    deleteRule: 'cascade',
    fieldName: 'roleId',
  })
  role!: Role;
}
