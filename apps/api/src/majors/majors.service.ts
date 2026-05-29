import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Major } from '../entities/major.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface MajorRowDto {
  id: number;
  name: string;
  code: string;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListMajorsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  statusFilter?: number;
  updatedAtFrom?: string;
  updatedAtTo?: string;
  deletedAtFrom?: string;
  deletedAtTo?: string;
}

export interface ListMajorsResult {
  data: MajorRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function mapRow(r: Major): MajorRowDto {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    status: r.status,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class MajorsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListMajorsParams): Promise<ListMajorsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    const status = params.status ?? 'active';

    if (status === 'deleted') where.deletedAt = { $ne: null };
    else if (status === 'active') where.deletedAt = null;

    if (params.statusFilter != null) {
      where.status = params.statusFilter;
    }
    if (params.updatedAtFrom) {
      where.updatedAt = {
        ...(where.updatedAt ?? {}),
        $gte: new Date(params.updatedAtFrom),
      };
    }
    if (params.updatedAtTo) {
      where.updatedAt = {
        ...(where.updatedAt ?? {}),
        $lte: new Date(params.updatedAtTo),
      };
    }
    if (params.deletedAtFrom) {
      where.deletedAt = {
        ...(where.deletedAt ?? {}),
        $gte: new Date(params.deletedAtFrom),
      };
    }
    if (params.deletedAtTo) {
      where.deletedAt = {
        ...(where.deletedAt ?? {}),
        $lte: new Date(params.deletedAtTo),
      };
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { name: { $like: `%${q}%` } },
        { code: { $like: `%${q}%` } },
      ];
    }

    const qb = where as FilterQuery<Major>;
    const [rows, total] = await Promise.all([
      this.em.find(Major, qb, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Major, qb),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<MajorRowDto | null> {
    const row = await this.em.findOne(Major, { id });
    return row ? mapRow(row) : null;
  }

  async create(data: { name: string; code: string }): Promise<MajorRowDto> {
    const entity = new Major();
    entity.name = data.name;
    entity.code = data.code;
    await this.em.persistAndFlush(entity);
    return mapRow(entity);
  }

  async update(
    id: number,
    data: { name?: string; code?: string; status?: number },
  ): Promise<MajorRowDto | null> {
    const existing = await this.em.findOne(Major, { id });
    if (!existing) return null;
    if (data.name != null) existing.name = data.name;
    if (data.code != null) existing.code = data.code;
    if (data.status != null) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(Major, { id });
    if (!row || row.deletedAt) return false;
    row.deletedAt = new Date();
    await this.em.persistAndFlush(row);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const row = await this.em.findOne(Major, { id });
    if (!row || !row.deletedAt) return false;
    row.deletedAt = null;
    await this.em.persistAndFlush(row);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(Major, { id });
    if (!row) return false;
    await this.em.removeAndFlush(row);
    return true;
  }
}
