import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Screen } from '../entities/screen.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface ScreenRowDto {
  id: string;
  name: string;
  code: string | null;
  cameraId: string | null;
  cameraName: string | null;
  templateId: string | null;
  templateName: string | null;
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

function mapRow(r: Screen): ScreenRowDto {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? null,
    cameraId: r.camera?.id ?? null,
    cameraName: r.camera?.name ?? null,
    templateId: r.template?.id ?? null,
    templateName: r.template?.name ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt) ?? '',
    updatedAt: toIso(r.updatedAt) ?? '',
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class ScreensService {
  constructor(private readonly em: EntityManager) {}

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'deleted' | 'all';
    statusFilter?: number;
    updatedAtFrom?: string;
    updatedAtTo?: string;
    deletedAtFrom?: string;
    deletedAtTo?: string;
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
    if (params.statusFilter != null) where.status = params.statusFilter;
    if (params.updatedAtFrom)
      where.updatedAt = {
        ...(where.updatedAt ?? {}),
        $gte: new Date(params.updatedAtFrom),
      };
    if (params.updatedAtTo)
      where.updatedAt = {
        ...(where.updatedAt ?? {}),
        $lte: new Date(params.updatedAtTo),
      };
    if (params.deletedAtFrom)
      where.deletedAt = {
        ...(where.deletedAt ?? {}),
        $gte: new Date(params.deletedAtFrom),
      };
    if (params.deletedAtTo)
      where.deletedAt = {
        ...(where.deletedAt ?? {}),
        $lte: new Date(params.deletedAtTo),
      };
    if (params.search?.trim()) {
      where.$or = [{ name: { $like: `%${params.search.trim()}%` } }];
    }
    const [rows, total] = await Promise.all([
      this.em.find(Screen, where as FilterQuery<Screen>, {
        populate: ['camera', 'template'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Screen, where as FilterQuery<Screen>),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<ScreenRowDto | null> {
    const r = await this.em.findOne(
      Screen,
      { id },
      { populate: ['camera', 'template'] },
    );
    return r ? mapRow(r) : null;
  }

  async create(data: Record<string, unknown>): Promise<ScreenRowDto> {
    const created = new Screen();
    const fields = ['name', 'code', 'status'] as const;
    for (const f of fields) {
      if (data[f] !== undefined) (created as any)[f] = data[f];
    }
    if (data.cameraId)
      created.camera = this.em.getReference(
        'Camera',
        data.cameraId as string,
      ) as any;
    if (data.templateId)
      created.template = this.em.getReference(
        'Template',
        data.templateId as string,
      ) as any;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<ScreenRowDto | null> {
    const existing = await this.em.findOne(Screen, { id });
    if (!existing) return null;
    const fields = ['name', 'code', 'status'] as const;
    for (const f of fields) {
      if (data[f] !== undefined) (existing as any)[f] = data[f];
    }
    if (data.cameraId !== undefined)
      existing.camera = data.cameraId
        ? (this.em.getReference('Camera', data.cameraId as string) as any)
        : null;
    if (data.templateId !== undefined)
      existing.template = data.templateId
        ? (this.em.getReference('Template', data.templateId as string) as any)
        : null;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Screen, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }
  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Screen, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }
  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Screen, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
