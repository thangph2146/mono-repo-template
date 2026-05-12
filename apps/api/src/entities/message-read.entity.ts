import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

/** Không thêm @Index trên message/user: ManyToOne đã sinh index FK; thêm nữa trùng tên khi schema:create (MySQL ER_DUP_KEYNAME). */
@Entity({ tableName: 'message_reads' })
@Unique({ properties: ['message', 'user'] })
export class MessageRead extends BaseEntity {
  @Property({ onCreate: () => new Date() })
  readAt!: Date;

  @ManyToOne(() => Message, {
    deleteRule: 'cascade',
    fieldName: 'messageId',
  })
  message!: Message;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;
}
