/**
 * Categories Admin API Service.
 * List, options, getById, create, update, softDelete, restore, hardDelete, bulk.
 */
import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import { Category } from '../entities/category.entity';
import { PostCategory } from '../entities/post-category.entity';

type CategoryWithParent = Category & {
  parent?: Category | null;
  childrenCount?: number;
};

export interface CategoryRowDto {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName?: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: { children: number };
  postCount?: number;
}

export interface ListCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListCategoriesResult {
  data: CategoryRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapRow(r: CategoryWithParent): CategoryRowDto {
  const toIsoString = (value: unknown): string | null => {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
  };

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parent?.id ?? null,
    parentName: r.parent?.name ?? null,
    description: r.description ?? null,
    createdAt: toIsoString(r.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(r.updatedAt) ?? new Date(0).toISOString(),
    deletedAt: toIsoString(r.deletedAt),
    _count: { children: r.childrenCount ?? 0 },
    postCount: 0,
  };
}

function buildWhere(params: ListCategoriesParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const status = params.status ?? 'active';

  if (status === 'deleted') {
    where.deletedAt = { $ne: null };
  } else if (status === 'active') {
    where.deletedAt = null;
  }

  if (params.search?.trim()) {
    const q = `%${params.search.trim()}%`;
    where.$or = [
      { name: { $like: q } },
      { slug: { $like: q } },
      { description: { $like: q } },
    ];
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const trimmed = value.trim();

      if (key === 'name') {
        where.name = { $like: `%${trimmed}%` };
      } else if (key === 'slug') {
        where.slug = { $like: `%${trimmed}%` };
      } else if (key === 'parentId') {
        const ids = trimmed.includes(',')
          ? trimmed
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : [trimmed];
        where.parent = ids.length > 1 ? { id: { $in: ids } } : ids[0];
      }
    }
  }

  return where;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly em: EntityManager) {}

  private async collectCategoryDescendantIds(
    rootId: string,
  ): Promise<string[]> {
    const start = String(rootId ?? '').trim();
    if (!start) return [];

    const visited = new Set<string>([start]);
    let frontier = [start];
    let safety = 0;

    while (frontier.length > 0 && safety < 50 && visited.size < 10000) {
      safety += 1;

      const children = await this.em.find(
        Category,
        {
          parent: { id: { $in: frontier } },
          deletedAt: null,
        },
        { fields: ['id'] },
      );

      const next: string[] = [];
      for (const child of children) {
        if (!visited.has(child.id)) {
          visited.add(child.id);
          next.push(child.id);
        }
      }
      frontier = next;
    }

    return Array.from(visited);
  }

  private async countPostsByCategoryTree(categoryId: string): Promise<number> {
    const ids = await this.collectCategoryDescendantIds(categoryId);
    const categoryIds = ids.length > 0 ? ids : [categoryId];

    return this.em.count(PostCategory, {
      category: { id: { $in: categoryIds } },
      post: { deletedAt: null },
    });
  }

  async list(params: ListCategoriesParams): Promise<ListCategoriesResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      1000,
    );
    const where = buildWhere(params) as FilterQuery<Category>;
    const status = params.status ?? 'active';
    const shouldResolveTreePostCount = status === 'active';

    const [rows, total] = await Promise.all([
      this.em.find(Category, where, {
        populate: shouldResolveTreePostCount
          ? ['parent', 'children']
          : ['parent'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Category, where),
    ]);

    const counts = shouldResolveTreePostCount
      ? await Promise.all(
          rows.map((row) => this.countPostsByCategoryTree(row.id)),
        )
      : rows.map(() => 0);

    const data = rows.map((row, index) => {
      const dto = mapRow(row as CategoryWithParent);
      dto.postCount = counts[index] ?? 0;
      return dto;
    });

    return {
      data,
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getOptions(
    column: string,
    search?: string,
    limit = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (search?.trim()) {
      const q = search.trim();
      if (column === 'name') where.name = { $like: `%${q}%` };
      else if (column === 'slug') where.slug = { $like: `%${q}%` };
      else if (column === 'parentId') where.parent = q;
      else where.name = { $like: `%${q}%` };
    }
    const rows = await this.em.find(Category, where as FilterQuery<Category>, {
      fields: [column as any],
      orderBy: { [column]: 'ASC' },
      limit,
    });
    const seen = new Set<string>();
    return rows
      .map((r) => {
        const val = r[column as keyof Category];
        return typeof val === 'string' || typeof val === 'number'
          ? String(val)
          : null;
      })
      .filter(
        (v): v is string => v !== null && !seen.has(v) && (seen.add(v), true),
      )
      .map((value) => ({ label: value, value }));
  }

  async getById(id: string): Promise<CategoryRowDto | null> {
    const row = await this.em.findOne(
      Category,
      { id },
      { populate: ['parent', 'children'] },
    );

    if (!row) return null;

    const dto = mapRow(row as CategoryWithParent);
    dto.postCount = await this.countPostsByCategoryTree(row.id);
    return dto;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
  }): Promise<CategoryRowDto> {
    const entity = new Category();
    entity.name = data.name;
    entity.slug = data.slug;
    entity.description = data.description ?? null;
    entity.parent = data.parentId
      ? this.em.getReference(Category, data.parentId)
      : null;
    this.em.persist(entity);
    await this.em.flush();

    const refetched = await this.getById(entity.id);
    if (!refetched) {
      throw new Error(`Failed to refetch category ${entity.id}`);
    }

    return refetched;
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
    },
  ): Promise<CategoryRowDto | null> {
    const existing = await this.em.findOne(Category, { id });
    if (!existing) return null;

    if (data.name != null) existing.name = data.name;
    if (data.slug != null) existing.slug = data.slug;
    if (data.description !== undefined)
      existing.description = data.description ?? null;
    if (data.parentId !== undefined) {
      existing.parent = data.parentId
        ? this.em.getReference(Category, data.parentId)
        : null;
    }

    this.em.persist(existing);
    await this.em.flush();

    return this.getById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(Category, { id });
    if (!row || row.deletedAt) return false;

    row.deletedAt = new Date();
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const row = await this.em.findOne(Category, { id });
    if (!row || !row.deletedAt) return false;

    row.deletedAt = null;
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(Category, { id });
    if (!row) return false;

    this.em.remove(row);
    await this.em.flush();
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete' | 'set-parent',
    ids: string[],
    parentId?: string | null,
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Category,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} danh mục`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Category,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} danh mục`,
      };
    }

    if (action === 'hard-delete') {
      const entities = await this.em.find(Category, { id: { $in: ids } });
      for (const e of entities) {
        this.em.remove(e);
      }
      await this.em.flush();
      return {
        affected: entities.length,
        message: `Đã xóa vĩnh viễn ${entities.length} danh mục`,
      };
    }

    const uniqueIds = [
      ...new Set(ids.map((id) => String(id ?? '').trim())),
    ].filter(Boolean);

    if (!uniqueIds.length) {
      return {
        affected: 0,
        message: 'Không có danh mục hợp lệ để cập nhật',
      };
    }

    const normalizedParentId =
      parentId == null || String(parentId).trim() === ''
        ? null
        : String(parentId).trim();

    if (normalizedParentId && uniqueIds.includes(normalizedParentId)) {
      return {
        affected: 0,
        message: 'Danh mục cha không được nằm trong danh sách đang chọn',
      };
    }

    if (normalizedParentId) {
      const parent = await this.em.findOne(
        Category,
        { id: normalizedParentId, deletedAt: null },
        { fields: ['id'] },
      );

      if (!parent) {
        return {
          affected: 0,
          message: 'Danh mục cha không tồn tại hoặc đã bị xóa',
        };
      }

      for (const categoryId of uniqueIds) {
        const descendants = await this.collectCategoryDescendantIds(categoryId);
        if (descendants.includes(normalizedParentId)) {
          return {
            affected: 0,
            message:
              'Không thể đổi danh mục cha vì sẽ tạo vòng lặp cây danh mục',
          };
        }
      }
    }

    const result = await this.em.nativeUpdate(
      Category,
      { id: { $in: uniqueIds }, deletedAt: null },
      { parent: normalizedParentId },
    );

    return {
      affected: result ?? 0,
      message:
        normalizedParentId == null
          ? `Đã chuyển ${result ?? 0} danh mục về cấp gốc`
          : `Đã cập nhật danh mục cha cho ${result ?? 0} danh mục`,
    };
  }
}
