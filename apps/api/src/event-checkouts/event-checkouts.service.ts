import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { EventRegistration } from '../entities/event-registration.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventCheckoutRowDto {
  id: string;
  eventId: string;
  email: string;
  fullName: string;
  phone: string | null;
  checkoutTime: string | null;
  attendanceStatus: number;
  attendanceMinutes: number;
  hasCheckin: boolean;
  faceVerified: boolean;
  createdAt: string | null;
}

export interface ListEventCheckoutsParams {
  eventId: string;
  page: number;
  limit: number;
  search?: string;
}

export interface ListEventCheckoutsResult {
  data: EventCheckoutRowDto[];
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

function mapRow(r: EventRegistration): EventCheckoutRowDto {
  return {
    id: r.id,
    eventId: r.event.id,
    email: r.email,
    fullName: r.fullName,
    phone: r.phone ?? null,
    checkoutTime: toIsoString(r.updatedAt),
    attendanceStatus: r.attendanceStatus,
    attendanceMinutes: r.attendanceMinutes,
    hasCheckin: r.hasCheckin,
    faceVerified: r.faceVerified,
    createdAt: toIsoString(r.createdAt),
  };
}

@Injectable()
export class EventCheckoutsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListEventCheckoutsParams,
  ): Promise<ListEventCheckoutsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {
      event: params.eventId,
      hasCheckout: true,
      deletedAt: null,
    };
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { email: { $like: `%${q}%` } },
        { fullName: { $like: `%${q}%` } },
      ];
    }
    const whereQuery = where as FilterQuery<EventRegistration>;
    const [rows, total] = await Promise.all([
      this.em.find(EventRegistration, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
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
}
