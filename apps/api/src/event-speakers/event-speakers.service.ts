import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { EventSpeaker } from '../entities/event-speaker.entity';
import { Event } from '../entities/event.entity';
import { Speaker } from '../entities/speaker.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventSpeakerRowDto {
  id: string;
  eventId: string;
  speakerId: number;
  speakerName: string;
  speakerTitle: string | null;
  speakerOrganization: string | null;
  sortOrder: number;
  role: string | null;
  presentationTitle: string | null;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  attachments: unknown;
}

export interface ListEventSpeakersParams {
  eventId: string;
  page: number;
  limit: number;
}

export interface ListEventSpeakersResult {
  data: EventSpeakerRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toIsoString(
  value: Date | string | number | undefined | null,
): string | null {
  if (value == null) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number')
    return Number.isNaN(value) ? null : new Date(value).toISOString();
  if (typeof value === 'string' && value.trim()) {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  return null;
}

function mapRow(r: EventSpeaker): EventSpeakerRowDto {
  return {
    id: r.id,
    eventId: r.event.id,
    speakerId: r.speaker.id,
    speakerName: r.speaker.name,
    speakerTitle: r.speaker.title ?? null,
    speakerOrganization: r.speaker.organization ?? null,
    sortOrder: r.sortOrder,
    role: r.role ?? null,
    presentationTitle: r.presentationTitle ?? null,
    startTime: toIsoString(r.startTime),
    endTime: toIsoString(r.endTime),
    duration: r.duration ?? null,
    attachments: r.attachments ?? null,
  };
}

@Injectable()
export class EventSpeakersService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListEventSpeakersParams,
  ): Promise<ListEventSpeakersResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const [rows, total] = await Promise.all([
      this.em.find(
        EventSpeaker,
        { event: params.eventId },
        {
          populate: ['speaker', 'event'],
          orderBy: { sortOrder: 'ASC' },
          offset: skip,
          limit,
        },
      ),
      this.em.count(EventSpeaker, { event: params.eventId }),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<EventSpeakerRowDto | null> {
    const r = await this.em.findOne(
      EventSpeaker,
      { id },
      { populate: ['speaker', 'event'] },
    );
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    eventId: string;
    speakerId: number;
    sortOrder?: number;
    role?: string | null;
    presentationTitle?: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    duration?: number | null;
  }): Promise<EventSpeakerRowDto> {
    const created = new EventSpeaker();
    created.event = this.em.getReference(Event, data.eventId);
    created.speaker = this.em.getReference(Speaker, data.speakerId);
    if (data.sortOrder !== undefined) created.sortOrder = data.sortOrder;
    if (data.role !== undefined) created.role = data.role;
    if (data.presentationTitle !== undefined)
      created.presentationTitle = data.presentationTitle;
    if (data.startTime !== undefined)
      created.startTime =
        typeof data.startTime === 'string'
          ? new Date(data.startTime)
          : data.startTime;
    if (data.endTime !== undefined)
      created.endTime =
        typeof data.endTime === 'string'
          ? new Date(data.endTime)
          : data.endTime;
    if (data.duration !== undefined) created.duration = data.duration;
    await this.em.persistAndFlush(created);
    await this.em.populate(created, ['speaker', 'event']);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      speakerId?: number;
      sortOrder?: number;
      role?: string | null;
      presentationTitle?: string | null;
      startTime?: Date | string | null;
      endTime?: Date | string | null;
      duration?: number | null;
    },
  ): Promise<EventSpeakerRowDto | null> {
    const existing = await this.em.findOne(
      EventSpeaker,
      { id },
      { populate: ['speaker', 'event'] },
    );
    if (!existing) return null;
    if (data.speakerId !== undefined)
      existing.speaker = this.em.getReference(Speaker, data.speakerId);
    if (data.sortOrder !== undefined) existing.sortOrder = data.sortOrder;
    if (data.role !== undefined) existing.role = data.role;
    if (data.presentationTitle !== undefined)
      existing.presentationTitle = data.presentationTitle;
    if (data.startTime !== undefined)
      existing.startTime =
        typeof data.startTime === 'string'
          ? new Date(data.startTime)
          : data.startTime;
    if (data.endTime !== undefined)
      existing.endTime =
        typeof data.endTime === 'string'
          ? new Date(data.endTime)
          : data.endTime;
    if (data.duration !== undefined) existing.duration = data.duration;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async delete(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventSpeaker, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
