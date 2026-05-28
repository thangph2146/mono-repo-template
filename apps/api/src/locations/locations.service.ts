import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Location } from '../entities/location.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface LocationRowDto {
  id: number;
  name: string | null;
  address: string | null;
  mapUrl: string;
  status: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListLocationsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListLocationsResult {
  data: LocationRowDto[];
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

function mapRow(r: Location): LocationRowDto {
  return {
    id: r.id,
    name: r.name ?? null,
    address: r.address ?? null,
    mapUrl: r.mapUrl,
    status: r.status ?? null,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class LocationsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListLocationsParams): Promise<ListLocationsResult> {
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
        { name: { $like: `%${q}%` } },
        { address: { $like: `%${q}%` } },
      ];
    }
    const whereQuery = where as FilterQuery<Location>;
    const [rows, total] = await Promise.all([
      this.em.find(Location, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Location, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<LocationRowDto | null> {
    const r = await this.em.findOne(Location, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    name?: string | null;
    address?: string | null;
    mapUrl: string;
    status?: number | null;
  }): Promise<LocationRowDto> {
    const created = new Location();
    created.mapUrl = data.mapUrl;
    if (data.name !== undefined) created.name = data.name;
    if (data.address !== undefined) created.address = data.address;
    if (data.status !== undefined) created.status = data.status;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: number,
    data: {
      name?: string | null;
      address?: string | null;
      mapUrl?: string;
      status?: number | null;
    },
  ): Promise<LocationRowDto | null> {
    const existing = await this.em.findOne(Location, { id });
    if (!existing) return null;
    if (data.name !== undefined) existing.name = data.name;
    if (data.address !== undefined) existing.address = data.address;
    if (data.mapUrl !== undefined) existing.mapUrl = data.mapUrl;
    if (data.status !== undefined) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(Location, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const r = await this.em.findOne(Location, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(Location, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
