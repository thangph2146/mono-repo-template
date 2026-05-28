import { Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { EventRegistration } from './event-registration.entity';

export enum CheckinType {
  FACE_ID = 0,
  MANUAL = 1,
  QR_CODE = 2,
  ONLINE = 3,
}

@Entity({ tableName: 'event_checkins' })
export class EventCheckin extends BaseEntity {
  @ManyToOne(() => Event, {
    deleteRule: 'cascade',
    fieldName: 'eventId',
  })
  event!: Event;

  @Property()
  email!: string;

  @Property()
  fullName!: string;

  @ManyToOne(() => EventRegistration, {
    nullable: true,
    fieldName: 'registrationId',
  })
  registration?: EventRegistration | null;

  @Property({ onCreate: () => new Date() })
  checkinTime!: Date;

  @Enum({ default: CheckinType.MANUAL })
  checkinType: CheckinType = CheckinType.MANUAL;

  @Property({ nullable: true })
  faceImage?: string | null;

  @Property({ nullable: true })
  faceMatchScore?: number | null;

  @Property({ default: false })
  faceVerified: boolean = false;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ nullable: true })
  locationData?: string | null;

  @Property({ nullable: true })
  deviceInfo?: string | null;

  @Property({ nullable: true })
  ipAddress?: string | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
