import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Event } from '../entities/event.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventRowDto {
  id: string;
  title: string;
  slug: string | null;
  poster: unknown;
  description: string | null;
  content: unknown;
  startDate: string | null;
  endDate: string | null;
  checkinStart: string | null;
  checkinEnd: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  organizer: string | null;
  location: string | null;
  address: string | null;
  qrCode: string | null;
  status: number;
  totalRegistrations: number;
  totalCheckins: number;
  totalCheckouts: number;
  allowCheckin: boolean;
  allowCheckout: boolean;
  requireFaceId: boolean;
  maxParticipants: number;
  format: number;
  onlineLink: string | null;
  schedule: unknown;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListEventsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListEventsResult {
  data: EventRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toIso(
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

function mapRow(r: Event): EventRowDto {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug ?? null,
    poster: r.poster ?? null,
    description: r.description ?? null,
    content: r.content ?? null,
    startDate: toIso(r.startDate),
    endDate: toIso(r.endDate),
    checkinStart: toIso(r.checkinStart),
    checkinEnd: toIso(r.checkinEnd),
    registrationStart: toIso(r.registrationStart),
    registrationEnd: toIso(r.registrationEnd),
    organizer: r.organizer ?? null,
    location: r.location ?? null,
    address: r.address ?? null,
    qrCode: r.qrCode ?? null,
    status: r.status,
    totalRegistrations: r.totalRegistrations,
    totalCheckins: r.totalCheckins,
    totalCheckouts: r.totalCheckouts,
    allowCheckin: r.allowCheckin,
    allowCheckout: r.allowCheckout,
    requireFaceId: r.requireFaceId,
    maxParticipants: r.maxParticipants,
    format: r.format,
    onlineLink: r.onlineLink ?? null,
    schedule: r.schedule ?? null,
    createdBy: r.createdBy?.id ?? null,
    createdAt: toIso(r.createdAt) ?? '',
    updatedAt: toIso(r.updatedAt) ?? '',
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListEventsParams): Promise<ListEventsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    const status = params.status ?? 'active';
    if (status === 'deleted') where.deletedAt = { $ne: null };
    else if (status === 'active') where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { title: { $like: `%${q}%` } },
        { organizer: { $like: `%${q}%` } },
        { location: { $like: `%${q}%` } },
      ];
    }
    const whereQuery = where as FilterQuery<Event>;
    const [rows, total] = await Promise.all([
      this.em.find(Event, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Event, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<EventRowDto | null> {
    const r = await this.em.findOne(Event, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: Record<string, unknown>): Promise<EventRowDto> {
    const created = new Event();
    Object.assign(created, {
      title: data.title,
      slug: data.slug ?? null,
      poster: data.poster ?? null,
      description: data.description ?? null,
      content: data.content ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      checkinStart: data.checkinStart ?? null,
      checkinEnd: data.checkinEnd ?? null,
      registrationStart: data.registrationStart ?? null,
      registrationEnd: data.registrationEnd ?? null,
      organizer: data.organizer ?? null,
      location: data.location ?? null,
      address: data.address ?? null,
      qrCode: data.qrCode ?? null,
      status: data.status ?? 1,
      totalRegistrations: 0,
      totalCheckins: 0,
      totalCheckouts: 0,
      allowCheckin: data.allowCheckin ?? true,
      allowCheckout: data.allowCheckout ?? true,
      requireFaceId: data.requireFaceId ?? false,
      maxParticipants: data.maxParticipants ?? 0,
      format: data.format ?? 'offline',
      onlineLink: data.onlineLink ?? null,
      schedule: data.schedule ?? null,
    });
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<EventRowDto | null> {
    const existing = await this.em.findOne(Event, { id });
    if (!existing) return null;
    const fields = [
      'title',
      'slug',
      'poster',
      'description',
      'content',
      'startDate',
      'endDate',
      'checkinStart',
      'checkinEnd',
      'registrationStart',
      'registrationEnd',
      'organizer',
      'location',
      'address',
      'qrCode',
      'status',
      'allowCheckin',
      'allowCheckout',
      'requireFaceId',
      'maxParticipants',
      'format',
      'onlineLink',
      'schedule',
    ] as const;
    for (const f of fields) {
      if (data[f] !== undefined)
        (existing as unknown as Record<string, unknown>)[f] = data[f];
    }
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Event, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Event, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Event, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
