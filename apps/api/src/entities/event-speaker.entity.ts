import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Event } from './event.entity';
import { Speaker } from './speaker.entity';

@Entity({ tableName: 'event_speakers' })
@Unique({ properties: ['event', 'speaker'] })
export class EventSpeaker extends BaseEntity {
  @ManyToOne(() => Event, {
    deleteRule: 'cascade',
    fieldName: 'eventId',
  })
  event!: Event;

  @ManyToOne(() => Speaker, {
    deleteRule: 'cascade',
    fieldName: 'speakerId',
  })
  speaker!: Speaker;

  @Property({ default: 0 })
  sortOrder: number = 0;

  @Property({ nullable: true })
  role?: string | null;

  @Property({ nullable: true })
  presentationTitle?: string | null;

  @Property({ nullable: true })
  startTime?: Date | null;

  @Property({ nullable: true })
  endTime?: Date | null;

  @Property({ nullable: true })
  duration?: number | null;

  @Property({ type: 'json', nullable: true })
  attachments?: unknown;
}
