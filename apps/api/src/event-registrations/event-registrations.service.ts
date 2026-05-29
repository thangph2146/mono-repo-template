import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import {
  EventRegistration,
  RegistrationStatus,
  AttendanceStatus,
  CheckinMethod,
} from '../entities/event-registration.entity';
import { Event } from '../entities/event.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventRegistrationRowDto {
  id: string;
  eventId: string;
  email: string;
  fullName: string;
  phone: string | null;
  registeredAt: string | null;
  status: RegistrationStatus;
  faceVerified: boolean;
  hasCheckin: boolean;
  hasCheckout: boolean;
  attendanceStatus: AttendanceStatus;
  attendanceMinutes: number;
  checkinMethod: CheckinMethod;
  formData: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListEventRegistrationsParams {
  eventId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface ListEventRegistrationsResult {
  data: EventRegistrationRowDto[];
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

function mapRow(r: EventRegistration): EventRegistrationRowDto {
  return {
    id: r.id,
    eventId: r.event.id,
    email: r.email,
    fullName: r.fullName,
    phone: r.phone ?? null,
    registeredAt: toIsoString(r.registeredAt),
    status: r.status,
    faceVerified: r.faceVerified,
    hasCheckin: r.hasCheckin,
    hasCheckout: r.hasCheckout,
    attendanceStatus: r.attendanceStatus,
    attendanceMinutes: r.attendanceMinutes,
    checkinMethod: r.checkinMethod,
    formData: r.formData,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class EventRegistrationsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListEventRegistrationsParams,
  ): Promise<ListEventRegistrationsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    where.event = params.eventId;
    where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { email: { $like: `%${q}%` } },
        { fullName: { $like: `%${q}%` } },
      ];
    }
    if (params.status) {
      const parsed = parseInt(params.status, 10);
      if (!Number.isNaN(parsed)) {
        where.status = parsed;
      }
    }
    const whereQuery = where as FilterQuery<EventRegistration>;
    const [rows, total] = await Promise.all([
      this.em.find(EventRegistration, whereQuery, {
        orderBy: { createdAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(EventRegistration, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<EventRegistrationRowDto | null> {
    const r = await this.em.findOne(EventRegistration, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    eventId: string;
    email: string;
    fullName: string;
    phone?: string | null;
    registeredAt?: Date;
    status?: RegistrationStatus;
  }): Promise<EventRegistrationRowDto> {
    const created = new EventRegistration();
    created.event = this.em.getReference(Event, data.eventId);
    created.email = data.email;
    created.fullName = data.fullName;
    if (data.phone !== undefined) created.phone = data.phone;
    created.registeredAt = data.registeredAt ?? new Date();
    if (data.status !== undefined) created.status = data.status;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      email?: string;
      fullName?: string;
      phone?: string | null;
      status?: RegistrationStatus;
      faceVerified?: boolean;
      attendanceStatus?: AttendanceStatus;
      checkinMethod?: CheckinMethod;
    },
  ): Promise<EventRegistrationRowDto | null> {
    const existing = await this.em.findOne(EventRegistration, { id });
    if (!existing) return null;
    if (data.email !== undefined) existing.email = data.email;
    if (data.fullName !== undefined) existing.fullName = data.fullName;
    if (data.phone !== undefined) existing.phone = data.phone;
    if (data.status !== undefined) existing.status = data.status;
    if (data.faceVerified !== undefined)
      existing.faceVerified = data.faceVerified;
    if (data.attendanceStatus !== undefined)
      existing.attendanceStatus = data.attendanceStatus;
    if (data.checkinMethod !== undefined)
      existing.checkinMethod = data.checkinMethod;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventRegistration, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventRegistration, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(EventRegistration, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
