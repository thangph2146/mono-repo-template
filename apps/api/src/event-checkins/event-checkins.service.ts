import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { EventCheckin, CheckinType } from '../entities/event-checkin.entity';
import { Event } from '../entities/event.entity';
import { EventRegistration } from '../entities/event-registration.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventCheckinRowDto {
  id: string;
  eventId: string;
  email: string;
  fullName: string;
  registrationId: string | null;
  checkinTime: string;
  checkinType: number;
  faceImage: string | null;
  faceMatchScore: number | null;
  faceVerified: boolean;
  status: number;
  locationData: string | null;
  deviceInfo: string | null;
  ipAddress: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListEventCheckinsParams {
  page: number;
  limit: number;
  eventId: string;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListEventCheckinsResult {
  data: EventCheckinRowDto[];
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

function mapRow(r: EventCheckin): EventCheckinRowDto {
  return {
    id: r.id,
    eventId: r.event.id,
    email: r.email,
    fullName: r.fullName,
    registrationId: r.registration?.id ?? null,
    checkinTime: r.checkinTime.toISOString(),
    checkinType: r.checkinType,
    faceImage: r.faceImage ?? null,
    faceMatchScore: r.faceMatchScore ?? null,
    faceVerified: r.faceVerified,
    status: r.status,
    locationData: r.locationData ?? null,
    deviceInfo: r.deviceInfo ?? null,
    ipAddress: r.ipAddress ?? null,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class EventCheckinsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListEventCheckinsParams,
  ): Promise<ListEventCheckinsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = { eventId: params.eventId };
    const status = params.status ?? 'active';
    if (status === 'deleted') where.deletedAt = { $ne: null };
    else if (status === 'active') where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { email: { $like: `%${q}%` } },
        { fullName: { $like: `%${q}%` } },
      ];
    }
    const whereQuery = where as FilterQuery<EventCheckin>;
    const [rows, total] = await Promise.all([
      this.em.find(EventCheckin, whereQuery, {
        orderBy: { checkinTime: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(EventCheckin, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<EventCheckinRowDto | null> {
    const r = await this.em.findOne(EventCheckin, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    eventId: string;
    email: string;
    fullName: string;
    registrationId?: string | null;
    checkinTime?: Date;
    checkinType?: CheckinType;
  }): Promise<EventCheckinRowDto> {
    const created = new EventCheckin();
    created.event = this.em.getReference(Event, data.eventId);
    created.email = data.email;
    created.fullName = data.fullName;
    if (data.registrationId !== undefined) {
      created.registration = data.registrationId
        ? this.em.getReference(EventRegistration, data.registrationId)
        : null;
    }
    created.checkinTime = data.checkinTime ?? new Date();
    if (data.checkinType !== undefined) created.checkinType = data.checkinType;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      email?: string;
      fullName?: string;
      checkinType?: CheckinType;
      faceVerified?: boolean;
      status?: number;
    },
  ): Promise<EventCheckinRowDto | null> {
    const existing = await this.em.findOne(EventCheckin, { id });
    if (!existing) return null;
    if (data.email !== undefined) existing.email = data.email;
    if (data.fullName !== undefined) existing.fullName = data.fullName;
    if (data.checkinType !== undefined) existing.checkinType = data.checkinType;
    if (data.faceVerified !== undefined)
      existing.faceVerified = data.faceVerified;
    if (data.status !== undefined) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventCheckin, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventCheckin, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventCheckin, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
