import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Department } from '../entities/department.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface DepartmentRowDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function toIso(v: Date | string | number | undefined | null): string | null {
  if (v == null) return null;
  if (v instanceof Date)
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  return null;
}

function mapRow(r: Department): DepartmentRowDto {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    description: r.description ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt) ?? '',
    updatedAt: toIso(r.updatedAt) ?? '',
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class DepartmentsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'deleted' | 'all';
  }) {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    const s = params.status ?? 'active';
    if (s === 'deleted') where.deletedAt = { $ne: null };
    else if (s === 'active') where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { name: { $like: `%${q}%` } },
        { code: { $like: `%${q}%` } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.em.find(Department, where as FilterQuery<Department>, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Department, where as FilterQuery<Department>),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<DepartmentRowDto | null> {
    const r = await this.em.findOne(Department, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: Record<string, unknown>): Promise<DepartmentRowDto> {
    const created = new Department();
    const fields = ['name', 'code', 'description', 'status'] as const;
    for (const f of fields) {
      if (data[f] !== undefined) (created as any)[f] = data[f];
    }
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<DepartmentRowDto | null> {
    const existing = await this.em.findOne(Department, { id });
    if (!existing) return null;
    const fields = ['name', 'code', 'description', 'status'] as const;
    for (const f of fields) {
      if (data[f] !== undefined) (existing as any)[f] = data[f];
    }
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Department, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }
  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Department, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }
  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Department, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
