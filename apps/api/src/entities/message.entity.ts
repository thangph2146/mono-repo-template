import { Entity, Index, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Group } from './group.entity';
import { MessageRead } from './message-read.entity';
import { User } from './user.entity';

export enum MessageType {
  NOTIFICATION = 'NOTIFICATION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PERSONAL = 'PERSONAL',
  SYSTEM = 'SYSTEM',
}

@Entity({ tableName: 'messages' })
@Index({ properties: ['group', 'createdAt'] })
@Index({ properties: ['receiver', 'createdAt'] })
@Index({ properties: ['sender', 'createdAt'] })
export class Message extends BaseEntity {
  @Property()
  subject!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ default: false })
  isRead: boolean = false;

  @Property({ default: MessageType.NOTIFICATION })
  type: MessageType = MessageType.NOTIFICATION;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => Message, {
    nullable: true,
    deleteRule: 'cascade',
    fieldName: 'parentId',
  })
  parent?: Message | null;

  @OneToMany(() => Message, (message) => message.parent)
  replies!: Message[];

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'receiverId',
  })
  receiver?: User | null;

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'senderId',
  })
  sender?: User | null;

  @ManyToOne(() => Group, {
    nullable: true,
    deleteRule: 'cascade',
    fieldName: 'groupId',
  })
  group?: Group | null;

  @OneToMany(() => MessageRead, (messageRead) => messageRead.message)
  reads!: MessageRead[];
}
