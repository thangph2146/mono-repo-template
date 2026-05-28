import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Course } from '../entities/course.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface CourseRowDto {
  id: number;
  name: string;
  startYear: number | null;
  endYear: number | null;
  departmentId: number | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListCoursesParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListCoursesResult {
  data: CourseRowDto[];
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

function mapRow(r: Course): CourseRowDto {
  return {
    id: r.id,
    name: r.name,
    startYear: r.startYear ?? null,
    endYear: r.endYear ?? null,
    departmentId: r.departmentId ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class CoursesService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListCoursesParams): Promise<ListCoursesResult> {
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

    const qb = where as FilterQuery<Course>;
    const [rows, total] = await Promise.all([
      this.em.find(Course, qb, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Course, qb),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<CourseRowDto | null> {
    const row = await this.em.findOne(Course, { id });
    return row ? mapRow(row) : null;
  }

  async create(data: {
    name: string;
    startYear?: number | null;
    endYear?: number | null;
    departmentId?: number | null;
  }): Promise<CourseRowDto> {
    const entity = new Course();
    entity.name = data.name;
    if (data.startYear !== undefined) entity.startYear = data.startYear;
    if (data.endYear !== undefined) entity.endYear = data.endYear;
    if (data.departmentId !== undefined)
      entity.departmentId = data.departmentId;
    await this.em.persistAndFlush(entity);
    return mapRow(entity);
  }

  async update(
    id: number,
    data: {
      name?: string;
      startYear?: number | null;
      endYear?: number | null;
      departmentId?: number | null;
      status?: number;
    },
  ): Promise<CourseRowDto | null> {
    const existing = await this.em.findOne(Course, { id });
    if (!existing) return null;
    if (data.name != null) existing.name = data.name;
    if (data.startYear !== undefined) existing.startYear = data.startYear;
    if (data.endYear !== undefined) existing.endYear = data.endYear;
    if (data.departmentId !== undefined)
      existing.departmentId = data.departmentId;
    if (data.status != null) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(Course, { id });
    if (!row || row.deletedAt) return false;
    row.deletedAt = new Date();
    await this.em.persistAndFlush(row);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const row = await this.em.findOne(Course, { id });
    if (!row || !row.deletedAt) return false;
    row.deletedAt = null;
    await this.em.persistAndFlush(row);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const row = await this.em.findOne(Course, { id });
    if (!row) return false;
    await this.em.removeAndFlush(row);
    return true;
  }
}
