import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Group } from './group.entity';
import { User } from './user.entity';

export enum GroupRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  OWNER = 'OWNER',
}

/** Index đơn cột trên FK ManyToOne đã do ORM tạo — không @Index thêm (trùng tên trên MySQL). */
@Entity({ tableName: 'group_members' })
@Unique({ properties: ['group', 'user'] })
export class GroupMember extends BaseEntity {
  @Property({ default: GroupRole.MEMBER })
  role: GroupRole = GroupRole.MEMBER;

  @Property({ onCreate: () => new Date() })
  joinedAt!: Date;

  @Property({ nullable: true })
  leftAt?: Date | null;

  @ManyToOne(() => Group, {
    deleteRule: 'cascade',
    fieldName: 'groupId',
  })
  group!: Group;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;
}
