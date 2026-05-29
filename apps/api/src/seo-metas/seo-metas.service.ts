import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { SeoMeta } from '../entities/seo-meta.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface SeoMetaRowDto {
  id: string;
  page: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListSeoMetasParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListSeoMetasResult {
  data: SeoMetaRowDto[];
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

function mapRow(r: SeoMeta): SeoMetaRowDto {
  return {
    id: r.id,
    page: r.page,
    title: r.title ?? null,
    description: r.description ?? null,
    keywords: r.keywords ?? null,
    ogTitle: r.ogTitle ?? null,
    ogDescription: r.ogDescription ?? null,
    ogImage: r.ogImage ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class SeoMetasService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListSeoMetasParams): Promise<ListSeoMetasResult> {
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
      where.$or = [
        { page: { $like: `%${params.search.trim()}%` } },
        { title: { $like: `%${params.search.trim()}%` } },
      ];
    }

    const qb = where as FilterQuery<SeoMeta>;
    const [rows, total] = await Promise.all([
      this.em.find(SeoMeta, qb, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(SeoMeta, qb),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<SeoMetaRowDto | null> {
    const row = await this.em.findOne(SeoMeta, { id });
    return row ? mapRow(row) : null;
  }

  async create(data: {
    page: string;
    title?: string | null;
    description?: string | null;
    keywords?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
  }): Promise<SeoMetaRowDto> {
    const entity = new SeoMeta();
    entity.page = data.page;
    if (data.title !== undefined) entity.title = data.title ?? undefined;
    if (data.description !== undefined)
      entity.description = data.description ?? undefined;
    if (data.keywords !== undefined)
      entity.keywords = data.keywords ?? undefined;
    if (data.ogTitle !== undefined) entity.ogTitle = data.ogTitle ?? undefined;
    if (data.ogDescription !== undefined)
      entity.ogDescription = data.ogDescription ?? undefined;
    if (data.ogImage !== undefined) entity.ogImage = data.ogImage ?? undefined;
    await this.em.persistAndFlush(entity);
    return mapRow(entity);
  }

  async update(
    id: string,
    data: {
      page?: string;
      title?: string | null;
      description?: string | null;
      keywords?: string | null;
      ogTitle?: string | null;
      ogDescription?: string | null;
      ogImage?: string | null;
      status?: number;
    },
  ): Promise<SeoMetaRowDto | null> {
    const existing = await this.em.findOne(SeoMeta, { id });
    if (!existing) return null;
    if (data.page != null) existing.page = data.page;
    if (data.title !== undefined) existing.title = data.title ?? undefined;
    if (data.description !== undefined)
      existing.description = data.description ?? undefined;
    if (data.keywords !== undefined)
      existing.keywords = data.keywords ?? undefined;
    if (data.ogTitle !== undefined)
      existing.ogTitle = data.ogTitle ?? undefined;
    if (data.ogDescription !== undefined)
      existing.ogDescription = data.ogDescription ?? undefined;
    if (data.ogImage !== undefined)
      existing.ogImage = data.ogImage ?? undefined;
    if (data.status != null) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(SeoMeta, { id });
    if (!row || row.deletedAt) return false;
    row.deletedAt = new Date();
    await this.em.persistAndFlush(row);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const row = await this.em.findOne(SeoMeta, { id });
    if (!row || !row.deletedAt) return false;
    row.deletedAt = null;
    await this.em.persistAndFlush(row);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(SeoMeta, { id });
    if (!row) return false;
    await this.em.removeAndFlush(row);
    return true;
  }
}
