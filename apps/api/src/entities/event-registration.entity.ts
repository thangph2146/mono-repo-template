import { Entity, Enum, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';

export enum RegistrationStatus {
  PENDING = 0,
  CONFIRMED = 1,
  CANCELLED = 2,
}

export enum AttendanceStatus {
  NOT_ATTENDED = 0,
  PARTIAL = 1,
  FULL = 2,
}

export enum CheckinMethod {
  NONE = 0,
  QR_CODE = 1,
  FACE_ID = 2,
  MANUAL = 3,
}

@Entity({ tableName: 'event_registrations' })
@Unique({ properties: ['event', 'email'] })
export class EventRegistration extends BaseEntity {
  @ManyToOne(() => Event, {
    deleteRule: 'cascade',
    fieldName: 'eventId',
  })
  event!: Event;

  @Property()
  email!: string;

  @Property()
  fullName!: string;

  @Property({ nullable: true })
  phone?: string | null;

  @Property({ nullable: true })
  registeredAt?: Date | null;

  @Enum({ default: RegistrationStatus.PENDING })
  status: RegistrationStatus = RegistrationStatus.PENDING;

  @Property({ default: false })
  faceVerified: boolean = false;

  @Property({ default: false })
  hasCheckin: boolean = false;

  @Property({ default: false })
  hasCheckout: boolean = false;

  @Enum({ default: AttendanceStatus.NOT_ATTENDED })
  attendanceStatus: AttendanceStatus = AttendanceStatus.NOT_ATTENDED;

  @Property({ default: 0 })
  attendanceMinutes: number = 0;

  @Enum({ default: CheckinMethod.NONE })
  checkinMethod: CheckinMethod = CheckinMethod.NONE;

  @Property({ type: 'json', nullable: true })
  formData?: unknown;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
