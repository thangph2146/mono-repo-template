import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Category } from '../entities/category.entity';
import { PostCategory } from '../entities/post-category.entity';

export interface PublicCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  _count: { children: number };
  postCount: number;
}

@Injectable()
export class PublicCategoriesService {
  constructor(private readonly em: EntityManager) {}

  async getCategories(slug?: string): Promise<PublicCategoryItem[]> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (slug) {
      where.slug = slug;
    }
    const rows = await this.em.find(Category, where as FilterQuery<Category>, {
      populate: ['parent'],
      orderBy: { parent: 'ASC', name: 'ASC' },
    });

    const ids = rows.map((r) => r.id);
    const childrenCounts = await Promise.all(
      ids.map((id) => this.em.count(Category, { parent: id, deletedAt: null })),
    );
    const postsCounts = await Promise.all(
      ids.map((id) => this.em.count(PostCategory, { category: id })),
    );

    return rows.map((r, i) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description ?? null,
      parentId: (r.parent as any)?.id ?? null,
      parentName: r.parent?.name ?? null,
      _count: { children: childrenCounts[i] },
      postCount: postsCounts[i],
    }));
  }
}
