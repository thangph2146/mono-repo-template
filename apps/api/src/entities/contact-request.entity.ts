import { Entity, Index, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ContactStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum ContactPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity({ tableName: 'contact_requests' })
@Index({ properties: ['submittedBy', 'createdAt'] })
/** Không @Index(['assignedTo']): ManyToOne assignedTo đã có index trên assignedToId — trùng tên trên MySQL. */
@Index({ properties: ['status'] })
@Index({ properties: ['priority'] })
@Index({ properties: ['isRead'] })
export class ContactRequest extends BaseEntity {
  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  phone?: string | null;

  @Property()
  subject!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({ default: ContactStatus.NEW })
  status: ContactStatus = ContactStatus.NEW;

  @Property({ default: ContactPriority.MEDIUM })
  priority: ContactPriority = ContactPriority.MEDIUM;

  @Property({ default: false })
  isRead: boolean = false;

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'userId',
  })
  submittedBy?: User | null;

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'assignedToId',
  })
  assignedTo?: User | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
