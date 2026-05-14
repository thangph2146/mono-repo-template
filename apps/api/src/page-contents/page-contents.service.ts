import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { PageContent } from '../entities/page-content.entity';

export interface PageContentCreateInput {
  pageKey: string;
  sectionKey: string;
  content: Record<string, unknown>;
  isVisible?: boolean;
}

export interface PageContentUpdateInput {
  pageKey?: string;
  sectionKey?: string;
  content?: Record<string, unknown>;
  isVisible?: boolean;
}

@Injectable()
export class PageContentsService {
  constructor(private readonly em: EntityManager) {}

  async getByKey(pageKey: string) {
    return this.em.find(
      PageContent,
      { pageKey },
      {
        orderBy: { createdAt: 'ASC' },
      },
    );
  }

  async getByPageAndSection(pageKey: string, sectionKey: string) {
    return this.em.findOne(PageContent, { pageKey, sectionKey });
  }

  async getById(id: string) {
    return this.em.findOne(PageContent, { id });
  }

  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      where.$or = [{ pageKey: { $like: s } }, { sectionKey: { $like: s } }];
    }
    const whereQuery = where as unknown as FilterQuery<PageContent>;

    const [data, total] = await Promise.all([
      this.em.find(PageContent, whereQuery, {
        offset,
        limit,
        orderBy: { updatedAt: 'DESC' },
      }),
      this.em.count(PageContent, whereQuery),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: PageContentCreateInput) {
    const entity = new PageContent();
    Object.assign(entity, data);
    await this.em.persistAndFlush(entity);
    return entity;
  }

  async update(id: string, data: PageContentUpdateInput) {
    const existing = await this.em.findOne(PageContent, { id });
    if (!existing) {
      return null;
    }

    Object.assign(existing, data);
    await this.em.persistAndFlush(existing);
    return existing;
  }

  async delete(id: string) {
    const existing = await this.em.findOne(PageContent, { id });
    if (!existing) {
      return null;
    }

    await this.em.removeAndFlush(existing);
    return existing;
  }
}
