import { Entity, Enum, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { EventCheckin } from './event-checkin.entity';
import { EventRegistration } from './event-registration.entity';
import { EventSpeaker } from './event-speaker.entity';
import { User } from './user.entity';

export enum EventFormat {
  OFFLINE = 0,
  ONLINE = 1,
  HYBRID = 2,
}

@Entity({ tableName: 'events' })
export class Event extends BaseEntity {
  @Property()
  title!: string;

  @Property({ nullable: true })
  slug?: string | null;

  @Property({ type: 'json', nullable: true, comment: 'Poster image metadata' })
  poster?: unknown;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({
    type: 'json',
    nullable: true,
    comment: 'Lexical rich text (JSON)',
  })
  content?: unknown;

  @Property({ nullable: true })
  startDate?: Date | null;

  @Property({ nullable: true })
  endDate?: Date | null;

  @Property({ nullable: true })
  checkinStart?: Date | null;

  @Property({ nullable: true })
  checkinEnd?: Date | null;

  @Property({ nullable: true })
  registrationStart?: Date | null;

  @Property({ nullable: true })
  registrationEnd?: Date | null;

  @Property({ nullable: true })
  organizer?: string | null;

  @Property({ nullable: true })
  location?: string | null;

  @Property({ nullable: true })
  address?: string | null;

  @Property({ nullable: true })
  qrCode?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ default: 0 })
  totalRegistrations: number = 0;

  @Property({ default: 0 })
  totalCheckins: number = 0;

  @Property({ default: 0 })
  totalCheckouts: number = 0;

  @Property({ default: true })
  allowCheckin: boolean = true;

  @Property({ default: true })
  allowCheckout: boolean = true;

  @Property({ default: false })
  requireFaceId: boolean = false;

  @Property({ default: 0 })
  maxParticipants: number = 0;

  @Enum({ default: EventFormat.OFFLINE })
  format: EventFormat = EventFormat.OFFLINE;

  @Property({ nullable: true })
  onlineLink?: string | null;

  @Property({ type: 'json', nullable: true })
  schedule?: unknown;

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'createdById',
  })
  createdBy?: User | null;

  @OneToMany(() => EventSpeaker, (es) => es.event)
  speakers!: EventSpeaker[];

  @OneToMany(() => EventRegistration, (er) => er.event)
  registrations!: EventRegistration[];

  @OneToMany(() => EventCheckin, (ec) => ec.event)
  checkins!: EventCheckin[];

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
