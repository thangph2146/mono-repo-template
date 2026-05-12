import { Entity, Property, OneToMany } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Account } from './account.entity';
import { Comment } from './comment.entity';
import { ContactRequest } from './contact-request.entity';
import { GroupMember } from './group-member.entity';
import { Group } from './group.entity';
import { MessageRead } from './message-read.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';
import { Post } from './post.entity';
import { Session } from './session.entity';
import { Student } from './student.entity';
import { UserRole } from './user-role.entity';

@Entity({ tableName: 'users' })
export class User extends BaseEntity {
  @Property({ nullable: true })
  email?: string | null;

  @Property({ nullable: true })
  name?: string | null;

  @Property()
  password!: string;

  @Property({ type: 'text', nullable: true })
  bio?: string | null;

  @Property({ nullable: true })
  avatar?: string | null;

  @Property({ nullable: true })
  emailVerified?: Date | null;

  @Property({ nullable: true })
  phone?: string | null;

  @Property({ nullable: true })
  address?: string | null;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @OneToMany(() => Message, (message) => message.sender)
  messagesSent!: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  messagesReceived!: Message[];

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Student, (student) => student.user)
  students!: Student[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(
    () => ContactRequest,
    (contactRequest) => contactRequest.submittedBy,
  )
  contactRequestsSubmitted!: ContactRequest[];

  @OneToMany(
    () => ContactRequest,
    (contactRequest) => contactRequest.assignedTo,
  )
  contactRequestsAssigned!: ContactRequest[];

  @OneToMany(() => Group, (group) => group.creator)
  groupsCreated!: Group[];

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groupMemberships!: GroupMember[];

  @OneToMany(() => MessageRead, (messageRead) => messageRead.user)
  messageReads!: MessageRead[];
}
