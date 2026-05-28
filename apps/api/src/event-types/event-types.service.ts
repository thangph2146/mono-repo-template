import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { EventType } from '../entities/event-type.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface EventTypeRowDto {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListEventTypesParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ListEventTypesResult {
  data: EventTypeRowDto[];
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

function mapRow(r: EventType): EventTypeRowDto {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug ?? null,
    description: r.description ?? null,
    status: r.status,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class EventTypesService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListEventTypesParams): Promise<ListEventTypesResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = { deletedAt: null };

    if (params.search?.trim()) {
      const q = `%${params.search.trim()}%`;
      where.$or = [{ name: { $like: q } }, { slug: { $like: q } }];
    }

    const whereQuery = where as FilterQuery<EventType>;
    const [rows, total] = await Promise.all([
      this.em.find(EventType, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(EventType, whereQuery),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<EventTypeRowDto | null> {
    const r = await this.em.findOne(EventType, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: {
    name: string;
    slug?: string | null;
    description?: string | null;
    status?: number;
  }): Promise<EventTypeRowDto> {
    const created = new EventType();
    created.name = data.name;
    if (data.slug !== undefined) created.slug = data.slug;
    if (data.description !== undefined) created.description = data.description;
    if (data.status !== undefined) created.status = data.status;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: number,
    data: {
      name?: string;
      slug?: string | null;
      description?: string | null;
      status?: number;
    },
  ): Promise<EventTypeRowDto | null> {
    const existing = await this.em.findOne(EventType, { id });
    if (!existing) return null;

    if (data.name !== undefined) existing.name = data.name;
    if (data.slug !== undefined) existing.slug = data.slug;
    if (data.description !== undefined) existing.description = data.description;
    if (data.status !== undefined) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(EventType, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const r = await this.em.findOne(EventType, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(EventType, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
