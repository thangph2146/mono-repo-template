import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Tag } from '../entities/tag.entity';
import { PostTag } from '../entities/post-tag.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import {
  getOptionsFromModel,
  type GetOptionsConfig,
} from '../common/get-options';

export interface RelatedPostDto {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface TagDetailDto extends TagRowDto {
  postCount: number;
  posts: RelatedPostDto[];
}

export interface TagRowDto {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListTagsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListTagsResult {
  data: TagRowDto[];
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
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  return null;
}

function toIsoStringRequired(value: Date | string | number): string {
  return toIsoString(value) ?? new Date(0).toISOString();
}

function mapRow(r: Tag): TagRowDto {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    createdAt: toIsoStringRequired(r.createdAt),
    updatedAt: toIsoStringRequired(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

const TAG_OPTIONS_CONFIG: GetOptionsConfig = {
  id: { valueField: 'id', labelField: 'name', searchField: 'name' },
  slug: { valueField: 'slug', searchField: 'slug' },
  name: { valueField: 'name', searchField: 'name' },
  '*': { valueField: 'name', searchField: 'name' },
};

@Injectable()
export class TagsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListTagsParams): Promise<ListTagsResult> {
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
        { slug: { $like: `%${q}%` } },
      ];
    }

    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (!value?.trim()) continue;
        const v = value.trim();
        if (key === 'name') where.name = { $like: `%${v}%` };
        else if (key === 'slug') where.slug = { $like: `%${v}%` };
        else if (key === 'deletedAt') {
          const dates = v.split(',').filter(Boolean);
          if (dates.length === 1) {
            where.deletedAt = { $gte: new Date(dates[0]) };
          } else if (dates.length >= 2) {
            where.deletedAt = {
              $gte: new Date(dates[0]),
              $lte: new Date(dates[1]),
            };
          }
        } else if (key === 'updatedAt') {
          const dates = v.split(',').filter(Boolean);
          if (dates.length === 1) {
            where.updatedAt = { $gte: new Date(dates[0]) };
          } else if (dates.length >= 2) {
            where.updatedAt = {
              $gte: new Date(dates[0]),
              $lte: new Date(dates[1]),
            };
          }
        }
      }
    }

    const whereQuery = where as FilterQuery<Tag>;
    const [rows, total] = await Promise.all([
      this.em.find(Tag, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Tag, whereQuery),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getOptions(
    column: string,
    search?: string,
    limit = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    return getOptionsFromModel(
      this.em.getRepository(Tag),
      { deletedAt: null },
      column,
      TAG_OPTIONS_CONFIG,
      search,
      limit,
    );
  }

  async getById(id: string): Promise<TagDetailDto | null> {
    const r = await this.em.findOne(Tag, { id });
    if (!r) return null;

    const postPivotRows = await this.em.find(
      PostTag,
      { tag: r.id },
      {
        populate: ['post'],
        limit: 10,
        orderBy: { post: { createdAt: 'DESC' } },
      },
    );

    const postCount = await this.em.count(PostTag, { tag: r.id });

    const posts = postPivotRows.map((pt) => {
      const p = pt.post;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        published: p.published,
        publishedAt: toIsoString(p.publishedAt),
        createdAt: toIsoStringRequired(p.createdAt),
      };
    });

    const dto = mapRow(r);
    (dto as TagDetailDto).postCount = postCount;
    (dto as TagDetailDto).posts = posts;
    return dto as TagDetailDto;
  }

  async create(data: { name: string; slug: string }): Promise<TagRowDto> {
    const created = new Tag();
    created.name = data.name;
    created.slug = data.slug;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string },
  ): Promise<TagRowDto | null> {
    const existing = await this.em.findOne(Tag, { id });
    if (!existing) return null;

    if (data.name != null) existing.name = data.name;
    if (data.slug != null) existing.slug = data.slug;
    await this.em.persistAndFlush(existing);
    const updated = existing;
    return mapRow(updated);
  }

  async softDelete(id: string): Promise<boolean> {
    const trimmed = id.trim();
    const r = await this.em.findOne(Tag, { id: trimmed });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const trimmed = id.trim();
    const r = await this.em.findOne(Tag, { id: trimmed });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const trimmed = id.trim();
    const r = await this.em.findOne(Tag, { id: trimmed });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };

    const trimmedIds = ids.map((x) => String(x).trim()).filter(Boolean);
    if (!trimmedIds.length)
      return { affected: 0, message: 'Không có bản ghi nào' };

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Tag,
        { id: { $in: trimmedIds }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} thẻ`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Tag,
        { id: { $in: trimmedIds }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} thẻ`,
      };
    }

    if (action === 'hard-delete') {
      const entities = await this.em.find(Tag, { id: { $in: trimmedIds } });
      await this.em.removeAndFlush(entities);
      const result = entities;
      return {
        affected: result.length,
        message: `Đã xóa vĩnh viễn ${result.length} thẻ`,
      };
    }

    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
