import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum NotificationKind {
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  REMINDER = 'REMINDER',
  INFO = 'INFO',
  ALERT = 'ALERT',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
}

@Entity({ tableName: 'notifications' })
@Index({ properties: ['user', 'isRead'] })
@Index({ properties: ['user', 'createdAt'] })
@Index({ properties: ['kind'] })
export class Notification extends BaseEntity {
  @Property({ default: NotificationKind.MESSAGE })
  kind: NotificationKind = NotificationKind.MESSAGE;

  @Property()
  title!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ default: false })
  isRead: boolean = false;

  @Property({ nullable: true })
  actionUrl?: string | null;

  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Property({ nullable: true })
  expiresAt?: Date | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  readAt?: Date | null;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;
}
