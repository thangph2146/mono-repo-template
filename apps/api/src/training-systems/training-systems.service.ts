import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { TrainingSystem } from '../entities/training-system.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface TrainingSystemRowDto {
  id: number;
  name: string;
  code: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListTrainingSystemsParams {
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

export interface ListTrainingSystemsResult {
  data: TrainingSystemRowDto[];
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

function mapRow(r: TrainingSystem): TrainingSystemRowDto {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class TrainingSystemsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListTrainingSystemsParams,
  ): Promise<ListTrainingSystemsResult> {
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

    const qb = where as FilterQuery<TrainingSystem>;
    const [rows, total] = await Promise.all([
      this.em.find(TrainingSystem, qb, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(TrainingSystem, qb),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<TrainingSystemRowDto | null> {
    const row = await this.em.findOne(TrainingSystem, { id });
    return row ? mapRow(row) : null;
  }

  async create(data: {
    name: string;
    code?: string | null;
  }): Promise<TrainingSystemRowDto> {
    const entity = new TrainingSystem();
    entity.name = data.name;
    if (data.code != null) entity.code = data.code;
    await this.em.persistAndFlush(entity);
    return mapRow(entity);
  }

  async update(
    id: number,
    data: { name?: string; code?: string | null; status?: number },
  ): Promise<TrainingSystemRowDto | null> {
    const existing = await this.em.findOne(TrainingSystem, { id });
    if (!existing) return null;
    if (data.name != null) existing.name = data.name;
    if (data.code !== undefined) existing.code = data.code;
    if (data.status != null) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(TrainingSystem, { id });
    if (!row || row.deletedAt) return false;
    row.deletedAt = new Date();
    await this.em.persistAndFlush(row);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const row = await this.em.findOne(TrainingSystem, { id });
    if (!row || !row.deletedAt) return false;
    row.deletedAt = null;
    await this.em.persistAndFlush(row);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(TrainingSystem, { id });
    if (!row) return false;
    await this.em.removeAndFlush(row);
    return true;
  }
}
