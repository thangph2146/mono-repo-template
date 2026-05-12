import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import {
  resolveRelationFilters,
  type RelationFiltersConfig,
} from '../common/resolve-relation-filters';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import {
  getOptionsFromModel,
  type GetOptionsConfig,
} from '../common/get-options';
import { safeIsoString, safeIsoStringNow } from '../common/date-utils';
import { Post } from '../entities/post.entity';
import { PostCategory } from '../entities/post-category.entity';
import { PostTag } from '../entities/post-tag.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../entities/user.entity';

export interface PostRowDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  published: boolean;
  publishedAt: string | null;
  eventStartAt: string | null;
  eventEndAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author: { id: string; name: string | null; email: string };
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
}

export interface PostDetailDto extends PostRowDto {
  content: unknown;
}

export const POSTS_FILTER_CATEGORIES_NONE = '__post_filter_no_category__';

export interface ListPostsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
  categoriesNone?: boolean;
}

export interface ListPostsResult {
  data: PostRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type PostCategoryItem = { category: Pick<Category, 'id' | 'name'> };
type PostTagItem = { tag: Pick<Tag, 'id' | 'name'> };
type PostWithRelations = Post & {
  author: Pick<User, 'id' | 'name' | 'email'>;
  categories?: PostCategoryItem[];
  tags?: PostTagItem[];
};

const POST_POPULATE = [
  'author',
  'categories',
  'categories.category',
  'tags',
  'tags.tag',
] as const;

function mapRow(p: PostWithRelations): PostRowDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? null,
    image: p.image ?? null,
    published: p.published,
    publishedAt: safeIsoString(p.publishedAt),
    eventStartAt: safeIsoString(p.eventStartAt),
    eventEndAt: safeIsoString(p.eventEndAt),
    createdAt: safeIsoStringNow(p.createdAt),
    updatedAt: safeIsoStringNow(p.updatedAt),
    deletedAt: safeIsoString(p.deletedAt),
    author: {
      id: p.author.id,
      name: p.author.name ?? null,
      email: p.author.email ?? '',
    },
    categories:
      p.categories?.map((pc) => ({
        id: pc.category.id,
        name: pc.category.name,
      })) ?? [],
    tags: p.tags?.map((pt) => ({ id: pt.tag.id, name: pt.tag.name })) ?? [],
  };
}

function buildWhere(
  params: ListPostsParams & { categoriesNone?: boolean },
): Record<string, unknown> {
  const baseWhere: Record<string, unknown> = {};
  const status = params.status ?? 'active';
  if (status === 'deleted') baseWhere.deletedAt = { $ne: null };
  else if (status === 'active') baseWhere.deletedAt = null;

  if (params.categoriesNone) {
    // Handled separately via in-memory filtering
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const v = value.trim();
      if (key === 'title') baseWhere.title = { $like: `%${v}%` };
      else if (key === 'slug') baseWhere.slug = { $like: `%${v}%` };
      else if (key === 'authorId') baseWhere.author = v;
      else if (key === 'published') baseWhere.published = v === 'true';
      else if (key === 'categories' || key === 'categoryId') {
        const ids = v.includes(',')
          ? v
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : [v];
        baseWhere.categories = {
          category: { id: ids.length > 1 ? { $in: ids } : ids[0] },
        };
      } else if (key === 'tags' || key === 'tagId') {
        baseWhere.tags = { tag: { id: v } };
      }
    }
  }

  if (params.search?.trim()) {
    const q = { $like: `%${params.search.trim()}%` };
    return {
      $or: [
        { ...baseWhere, title: q },
        { ...baseWhere, slug: q },
        { ...baseWhere, excerpt: q },
      ],
    };
  }

  return baseWhere;
}

const POST_RELATION_FILTERS: RelationFiltersConfig = {
  categories: { model: 'category', nameField: 'name', softDelete: true },
  categoryId: { model: 'category', nameField: 'name', softDelete: true },
  tags: { model: 'tag', nameField: 'name', softDelete: false },
  tagId: { model: 'tag', nameField: 'name', softDelete: false },
};

const POST_OPTIONS_CONFIG: GetOptionsConfig = {
  slug: { valueField: 'slug', searchField: 'slug' },
  title: { valueField: 'title', searchField: 'title' },
  '*': { valueField: 'title', searchField: 'title' },
};

const EXCERPT_MAX_LENGTH = 191;

function truncateExcerpt(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === '') return null;
  return s.length <= EXCERPT_MAX_LENGTH ? s : s.slice(0, EXCERPT_MAX_LENGTH);
}

function parseNullableDate(
  value: string | null | undefined,
  fieldName: string,
): Date | null {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`Giá trị ${fieldName} không hợp lệ`);
  }
  return parsed;
}

@Injectable()
export class PostsService {
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
        { parent: { $in: frontier }, deletedAt: null },
        { fields: ['id'] },
      );
      const next = children.map((c) => c.id).filter((id) => !visited.has(id));
      if (next.length === 0) break;
      next.forEach((id) => visited.add(id));
      frontier = next;
    }
    return Array.from(visited);
  }

  private async validateCategoryIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const found = await this.em.find(
      Category,
      { id: { $in: ids }, deletedAt: null },
      { fields: ['id'] },
    );
    const foundIds = new Set(found.map((f) => f.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Category ID không tồn tại: ${missing.join(', ')}`,
      );
    }
  }

  private async validateTagIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const found = await this.em.find(
      Tag,
      { id: { $in: ids }, deletedAt: null },
      { fields: ['id'] },
    );
    const foundIds = new Set(found.map((f) => f.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Tag ID không tồn tại: ${missing.join(', ')}`,
      );
    }
  }

  async list(params: ListPostsParams): Promise<ListPostsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const rawFilters = params.filters ? { ...params.filters } : undefined;
    let categoriesNone = false;
    if (
      rawFilters?.categories?.trim() === POSTS_FILTER_CATEGORIES_NONE ||
      rawFilters?.categoryId?.trim() === POSTS_FILTER_CATEGORIES_NONE
    ) {
      categoriesNone = true;
      delete rawFilters.categories;
      delete rawFilters.categoryId;
    }
    const filters = await resolveRelationFilters(
      this.em,
      rawFilters,
      POST_RELATION_FILTERS,
    );
    if (
      !categoriesNone &&
      (filters?.categories?.trim() || filters?.categoryId?.trim())
    ) {
      const key = filters.categories?.trim() ? 'categories' : 'categoryId';
      const rootId = filters[key];
      const ids = await this.collectCategoryDescendantIds(rootId);
      if (ids.length > 0) {
        filters[key] = ids.join(',');
      }
    }
    const where = params.categoriesNone
      ? {}
      : buildWhere({ ...params, filters });

    const queryOptions = {
      populate: POST_POPULATE,
      orderBy: { updatedAt: 'DESC' },
      offset: skip,
      limit,
    };

    const [rows, total] = await Promise.all([
      this.em.find(Post, where as FilterQuery<Post>, queryOptions),
      this.em.count(Post, where as FilterQuery<Post>),
    ]);

    let finalRows = rows;
    if (params.categoriesNone) {
      finalRows = rows.filter(
        (r) => !r.categories || r.categories.length === 0,
      );
    }

    return {
      data: finalRows.map((row) => mapRow(row as PostWithRelations)),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getOptions(
    column: string,
    search?: string,
    limit = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    return getOptionsFromModel(
      this.em.getRepository(Post),
      { deletedAt: null },
      column,
      POST_OPTIONS_CONFIG,
      search,
      limit,
    );
  }

  async getById(id: string): Promise<PostDetailDto | null> {
    const p = await this.em.findOne(
      Post,
      { id },
      {
        populate: POST_POPULATE,
      },
    );
    if (!p) return null;
    return { ...mapRow(p as PostWithRelations), content: p.content };
  }

  async getDatesWithPosts(): Promise<string[]> {
    const rows = await this.em.find(
      Post,
      { deletedAt: null },
      { fields: ['publishedAt', 'createdAt'] },
    );
    const dates = new Set<string>();
    for (const r of rows) {
      const d = r.publishedAt ?? r.createdAt;
      const iso = safeIsoString(d);
      if (iso) {
        dates.add(iso.slice(0, 10));
      }
    }
    return Array.from(dates).sort();
  }

  async create(
    authorId: string,
    data: {
      title: string;
      slug: string;
      content: unknown;
      excerpt?: string | null;
      image?: string | null;
      published?: boolean;
      publishedAt?: string | null;
      eventStartAt?: string | null;
      eventEndAt?: string | null;
      categoryIds?: string[];
      tagIds?: string[];
    },
  ): Promise<PostRowDto> {
    const categoryIds = (data.categoryIds ?? []).filter(
      (id) => id != null && String(id).trim() !== '',
    );
    const tagIds = (data.tagIds ?? []).filter(
      (id) => id != null && String(id).trim() !== '',
    );
    await this.validateCategoryIds(categoryIds);
    await this.validateTagIds(tagIds);

    const postObj = new Post();
    postObj.title = data.title;
    postObj.slug = data.slug;
    postObj.content = data.content;
    postObj.excerpt = truncateExcerpt(data.excerpt);
    postObj.image = data.image ?? null;
    postObj.published = data.published ?? false;
    postObj.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    postObj.eventStartAt = data.eventStartAt
      ? new Date(data.eventStartAt)
      : null;
    postObj.eventEndAt = data.eventEndAt ? new Date(data.eventEndAt) : null;
    postObj.author = this.em.getReference(User, authorId);
    this.em.persist(postObj);
    await this.em.flush();

    if (categoryIds.length) {
      for (const categoryId of categoryIds) {
        const postCategory = new PostCategory();
        postCategory.post = this.em.getReference(Post, postObj.id);
        postCategory.category = this.em.getReference(Category, categoryId);
        this.em.persist(postCategory);
      }
    }
    if (tagIds.length) {
      for (const tagId of tagIds) {
        const postTag = new PostTag();
        postTag.post = this.em.getReference(Post, postObj.id);
        postTag.tag = this.em.getReference(Tag, tagId);
        this.em.persist(postTag);
      }
    }
    await this.em.flush();

    const created = await this.em.findOne(
      Post,
      { id: postObj.id },
      {
        populate: POST_POPULATE,
      },
    );
    if (!created) {
      throw new BadRequestException('Không thể tải bài viết vừa tạo');
    }
    return mapRow(created as PostWithRelations);
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      content?: unknown;
      excerpt?: string | null;
      image?: string | null;
      published?: boolean;
      publishedAt?: string | null;
      eventStartAt?: string | null;
      eventEndAt?: string | null;
      categoryIds?: string[];
      tagIds?: string[];
      authorId?: string;
    },
  ): Promise<PostRowDto | null> {
    const existing = await this.em.findOne(Post, { id });
    if (!existing) return null;

    if (data.title != null) existing.title = data.title;
    if (data.slug != null) existing.slug = data.slug;
    if (data.content !== undefined) existing.content = data.content;
    if (data.excerpt !== undefined)
      existing.excerpt = truncateExcerpt(data.excerpt);
    if (data.image !== undefined) existing.image = data.image;
    if (data.published !== undefined) existing.published = data.published;
    if (data.authorId !== undefined) {
      const authorId = data.authorId.trim();
      if (!authorId) {
        throw new BadRequestException('authorId không hợp lệ');
      }
      const author = await this.em.findOne(User, { id: authorId });
      if (!author) {
        throw new BadRequestException('Tác giả không tồn tại');
      }
      existing.author = author;
    }
    if (data.publishedAt !== undefined)
      existing.publishedAt = parseNullableDate(data.publishedAt, 'publishedAt');
    if (data.eventStartAt !== undefined)
      existing.eventStartAt = parseNullableDate(
        data.eventStartAt,
        'eventStartAt',
      );
    if (data.eventEndAt !== undefined)
      existing.eventEndAt = parseNullableDate(data.eventEndAt, 'eventEndAt');

    this.em.persist(existing);
    await this.em.flush();

    if (data.categoryIds !== undefined) {
      const categoryIds = data.categoryIds.filter(
        (id) => id != null && String(id).trim() !== '',
      );
      await this.validateCategoryIds(categoryIds);
      await this.em.nativeDelete(PostCategory, { post: id });
      if (categoryIds.length > 0) {
        for (const categoryId of categoryIds) {
          const postCategory = new PostCategory();
          postCategory.post = this.em.getReference(Post, existing.id);
          postCategory.category = this.em.getReference(Category, categoryId);
          this.em.persist(postCategory);
        }
        await this.em.flush();
      }
    }
    if (data.tagIds !== undefined) {
      const tagIds = data.tagIds.filter(
        (id) => id != null && String(id).trim() !== '',
      );
      await this.validateTagIds(tagIds);
      await this.em.nativeDelete(PostTag, { post: id });
      if (tagIds.length > 0) {
        for (const tagId of tagIds) {
          const postTag = new PostTag();
          postTag.post = this.em.getReference(Post, existing.id);
          postTag.tag = this.em.getReference(Tag, tagId);
          this.em.persist(postTag);
        }
        await this.em.flush();
      }
    }

    const updated = await this.em.findOne(
      Post,
      { id },
      {
        populate: POST_POPULATE,
      },
    );
    if (!updated) return null;
    return mapRow(updated as PostWithRelations);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Post, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Post, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Post, { id });
    if (!r) return false;
    this.em.remove(r);
    await this.em.flush();
    return true;
  }

  async bulkSetCategories(
    ids: string[],
    categoryIds: string[],
    mode: 'replace' | 'add' = 'replace',
  ): Promise<{ affected: number; message: string }> {
    const uniquePostIds = [
      ...new Set(ids.map((id) => String(id).trim()).filter(Boolean)),
    ];
    if (!uniquePostIds.length) {
      return { affected: 0, message: 'Không có bài viết nào' };
    }
    const cats = [
      ...new Set(categoryIds.map((id) => String(id).trim()).filter(Boolean)),
    ];
    await this.validateCategoryIds(cats);

    let affected = 0;
    await this.em.transactional(async (tx) => {
      for (const postId of uniquePostIds) {
        const post = await tx.findOne(
          Post,
          { id: postId, deletedAt: null },
          { fields: ['id'] },
        );
        if (!post) continue;
        affected += 1;

        if (mode === 'replace') {
          await tx.nativeDelete(PostCategory, { post: postId });
          if (cats.length > 0) {
            for (const categoryId of cats) {
              const postCategory = new PostCategory();
              postCategory.post = tx.getReference(Post, postId);
              postCategory.category = tx.getReference(Category, categoryId);
              tx.persist(postCategory);
            }
            await tx.flush();
          }
        } else {
          const existing = await tx.find(
            PostCategory,
            { post: postId },
            { fields: ['category'] },
          );
          const have = new Set(
            existing
              .map((e) =>
                typeof e.category === 'string'
                  ? e.category
                  : (e.category?.id ?? null),
              )
              .filter((id): id is string => typeof id === 'string'),
          );
          const toAdd = cats.filter((c) => !have.has(c));
          if (toAdd.length > 0) {
            for (const categoryId of toAdd) {
              const postCategory = new PostCategory();
              postCategory.post = tx.getReference(Post, postId);
              postCategory.category = tx.getReference(Category, categoryId);
              tx.persist(postCategory);
            }
            await tx.flush();
          }
        }
      }
    });

    const label =
      mode === 'replace'
        ? `Đã cập nhật danh mục cho ${affected} bài viết`
        : `Đã thêm danh mục cho ${affected} bài viết`;
    return { affected, message: label };
  }

  async bulkClearImages(
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    const uniquePostIds = [
      ...new Set(ids.map((id) => String(id).trim()).filter(Boolean)),
    ];
    if (!uniquePostIds.length) {
      return { affected: 0, message: 'Không có bài viết nào' };
    }
    const result = await this.em.nativeUpdate(
      Post,
      { id: { $in: uniquePostIds }, deletedAt: null, image: { $ne: null } },
      { image: null },
    );
    return {
      affected: result ?? 0,
      message: `Đã xóa hình ảnh của ${result ?? 0} bài viết`,
    };
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };
    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Post,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} bài viết`,
      };
    }
    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Post,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} bài viết`,
      };
    }
    if (action === 'hard-delete') {
      const result = await this.em.nativeDelete(Post, { id: { $in: ids } });
      return {
        affected: result ?? 0,
        message: `Đã xóa vĩnh viễn ${result ?? 0} bài viết`,
      };
    }
    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
