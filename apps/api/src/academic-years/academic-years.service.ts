import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { AcademicYear } from '../entities/academic-year.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface AcademicYearRowDto {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListAcademicYearsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListAcademicYearsResult {
  data: AcademicYearRowDto[];
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

function mapRow(r: AcademicYear): AcademicYearRowDto {
  return {
    id: r.id,
    name: r.name,
    startDate: r.startDate ?? null,
    endDate: r.endDate ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class AcademicYearsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListAcademicYearsParams,
  ): Promise<ListAcademicYearsResult> {
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
      where.$or = [{ name: { $like: `%${params.search.trim()}%` } }];
    }

    const qb = where as FilterQuery<AcademicYear>;
    const [rows, total] = await Promise.all([
      this.em.find(AcademicYear, qb, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(AcademicYear, qb),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<AcademicYearRowDto | null> {
    const row = await this.em.findOne(AcademicYear, { id });
    return row ? mapRow(row) : null;
  }

  async create(data: {
    name: string;
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<AcademicYearRowDto> {
    const entity = new AcademicYear();
    entity.name = data.name;
    if (data.startDate !== undefined) entity.startDate = data.startDate;
    if (data.endDate !== undefined) entity.endDate = data.endDate;
    await this.em.persistAndFlush(entity);
    return mapRow(entity);
  }

  async update(
    id: number,
    data: {
      name?: string;
      startDate?: string | null;
      endDate?: string | null;
      status?: number;
    },
  ): Promise<AcademicYearRowDto | null> {
    const existing = await this.em.findOne(AcademicYear, { id });
    if (!existing) return null;
    if (data.name != null) existing.name = data.name;
    if (data.startDate !== undefined) existing.startDate = data.startDate;
    if (data.endDate !== undefined) existing.endDate = data.endDate;
    if (data.status != null) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(AcademicYear, { id });
    if (!row || row.deletedAt) return false;
    row.deletedAt = new Date();
    await this.em.persistAndFlush(row);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const row = await this.em.findOne(AcademicYear, { id });
    if (!row || !row.deletedAt) return false;
    row.deletedAt = null;
    await this.em.persistAndFlush(row);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(AcademicYear, { id });
    if (!row) return false;
    await this.em.removeAndFlush(row);
    return true;
  }
}
