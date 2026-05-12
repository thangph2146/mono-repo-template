import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { GroupMember } from './group-member.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity({ tableName: 'groups' })
export class Group extends BaseEntity {
  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ nullable: true })
  avatar?: string | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'createdById',
  })
  creator!: User;

  @OneToMany(() => GroupMember, (groupMember) => groupMember.group)
  members!: GroupMember[];

  @OneToMany(() => Message, (message) => message.group)
  messages!: Message[];
}
