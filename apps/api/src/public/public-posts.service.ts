import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Post } from '../entities/post.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { Setting } from '../entities/setting.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface PublicPostsQuery {
  page: number;
  limit: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
}

@Injectable()
export class PublicPostsService {
  constructor(private readonly em: EntityManager) {}

  private buildViewCountKey(postId: string): string {
    return `post_view_count:${postId}`;
  }

  private parseViewCount(value: any): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const n = parseInt(value, 10);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  private async getViewCountsMap(
    postIds: string[],
  ): Promise<Record<string, number>> {
    const ids = [...new Set(postIds.filter(Boolean))];
    if (ids.length === 0) return {};
    const keys = ids.map((id) => this.buildViewCountKey(id));
    const rows = await this.em.find(Setting, { key: { $in: keys } });
    const out: Record<string, number> = {};
    for (const r of rows) {
      const postId = r.key.replace(/^post_view_count:/, '');
      out[postId] = this.parseViewCount(r.value);
    }
    return out;
  }

  private async increaseViewCount(postId: string): Promise<number> {
    const key = this.buildViewCountKey(postId);
    const existing = await this.em.findOne(Setting, { key });
    const next = this.parseViewCount(existing?.value) + 1;
    if (existing) {
      existing.value = next as any;
      existing.group = 'analytics';
      this.em.persist(existing);
      await this.em.flush();
      return next;
    }
    const entity = new Setting();
    entity.key = key;
    entity.value = next as any;
    entity.group = 'analytics';
    this.em.persist(entity);
    await this.em.flush();
    return next;
  }

  async getPosts(params: PublicPostsQuery) {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      50,
    );
    let categoryId: string | undefined;
    let tagId: string | undefined;

    // Resolve categorySlug to categoryId
    if (params.categorySlug?.trim()) {
      const category = await this.em.findOne(Category, {
        slug: params.categorySlug.trim(),
        deletedAt: null,
      });
      if (category) categoryId = category.id;
    }

    // Resolve tagSlug to tagId
    if (params.tagSlug?.trim()) {
      const tag = await this.em.findOne(Tag, {
        slug: params.tagSlug.trim(),
      });
      if (tag) tagId = tag.id;
    }

    let categoryIds: string[] = [];
    if (categoryId) {
      const childCategories = await this.em.find(Category, {
        parent: categoryId,
        deletedAt: null,
      });
      categoryIds = [categoryId, ...childCategories.map((c) => c.id)];
    }

    const where: Record<string, unknown> = {
      published: true,
      deletedAt: null,
      publishedAt: { $lte: new Date() },
    };
    if (params.search) {
      const q = `%${params.search.trim()}%`;
      where.$or = [{ title: { $like: q } }, { excerpt: { $like: q } }];
    }
    if (categoryIds.length) {
      where.categories = { category: { id: { $in: categoryIds } } };
    }
    if (tagId) {
      where.tags = { tag: { id: tagId } };
    }
    const whereQuery = where as FilterQuery<Post>;

    const [posts, total] = await Promise.all([
      this.em.find(Post, whereQuery, {
        populate: [
          'author',
          'categories',
          'categories.category',
          'tags',
          'tags.tag',
        ],
        orderBy: { publishedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Post, whereQuery),
    ]);

    const viewCounts = await this.getViewCountsMap(posts.map((p) => p.id));
    return {
      data: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        image: p.image,
        publishedAt: p.publishedAt,
        eventStartAt: p.eventStartAt,
        eventEndAt: p.eventEndAt,
        author: {
          name: p.author?.name ?? null,
          avatar: p.author?.avatar,
        },
        categories: (p.categories || []).map((pc: any) => ({
          category: {
            name: pc.category.name,
            slug: pc.category.slug,
          },
        })),
        tags: (p.tags || []).map((pt: any) => ({
          tag: {
            name: pt.tag.name,
            slug: pt.tag.slug,
          },
        })),
        viewCount: viewCounts[p.id] ?? 0,
      })),
      meta: paginationMeta(page, limit, total),
    };
  }

  async getPostBySlug(slug: string, options?: { trackView?: boolean }) {
    const post = await this.em.findOne(
      Post,
      {
        slug,
        published: true,
        deletedAt: null,
        publishedAt: { $lte: new Date() },
      },
      {
        populate: [
          'author',
          'categories',
          'categories.category',
          'tags',
          'tags.tag',
        ],
      },
    );
    if (!post) return null;
    const trackView = options?.trackView !== false;
    const nextViewCount = trackView
      ? await this.increaseViewCount(post.id)
      : ((await this.getViewCountsMap([post.id]))[post.id] ?? 0);
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      image: post.image,
      publishedAt: post.publishedAt,
      author: {
        name: post.author?.name ?? null,
        avatar: post.author?.avatar,
      },
      categories: (post.categories || []).map((pc: any) => ({
        category: {
          name: pc.category.name,
          slug: pc.category.slug,
        },
      })),
      tags: (post.tags || []).map((pt: any) => ({
        tag: {
          name: pt.tag.name,
          slug: pt.tag.slug,
        },
      })),
      viewCount: nextViewCount,
    };
  }

  /**
   * Tăng lượt xem theo slug (public). Dùng từ client sau khi trang chi tiết đã hiển thị,
   * tránh ghi DB mỗi lần SSR/revalidate của GET /public/posts/:slug.
   */
  async incrementPostViewBySlug(
    slug: string,
  ): Promise<{ viewCount: number } | null> {
    const post = await this.em.findOne(Post, {
      slug,
      published: true,
      deletedAt: null,
      publishedAt: { $lte: new Date() },
    });
    if (!post) return null;
    const viewCount = await this.increaseViewCount(post.id);
    return { viewCount };
  }

  /** Bài cho block "Thông tin tuyển sinh" trang chủ: Thông báo mới nhất + Tin tuyển sinh */
  async getHomeAdmissionPosts(params?: {
    latestLimit?: number;
    admissionLimit?: number;
    admissionCategorySlug?: string;
  }) {
    const latestLimit = Math.min(10, Math.max(1, params?.latestLimit ?? 3));
    const admissionLimit = Math.min(
      10,
      Math.max(1, params?.admissionLimit ?? 3),
    );
    const admissionCategorySlug =
      params?.admissionCategorySlug?.trim() ?? 'tin-tuyen-sinh';

    // Resolve categorySlug to categoryId
    let categoryId: string | undefined;
    const category = await this.em.findOne(Category, {
      slug: admissionCategorySlug,
      deletedAt: null,
    });
    if (category) categoryId = category.id;

    const baseWhere: Record<string, unknown> = {
      published: true,
      deletedAt: null,
      publishedAt: { $lte: new Date() },
    };

    const [latestNews, admissionNews] = await Promise.all([
      this.em.find(Post, baseWhere as FilterQuery<Post>, {
        orderBy: { publishedAt: 'DESC' },
        limit: latestLimit,
      }),
      categoryId
        ? this.em.find(
            Post,
            Object.assign({}, baseWhere, {
              categories: { category: { id: categoryId } },
            }) as FilterQuery<Post>,
            {
              orderBy: { publishedAt: 'DESC' },
              limit: admissionLimit,
            },
          )
        : this.em.find(Post, baseWhere as FilterQuery<Post>, {
            orderBy: { publishedAt: 'DESC' },
            limit: admissionLimit,
          }),
    ]);

    const viewCounts = await this.getViewCountsMap([
      ...latestNews.map((p) => p.id),
      ...admissionNews.map((p) => p.id),
    ]);
    return {
      latestNews: latestNews.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        viewCount: viewCounts[p.id] ?? 0,
      })),
      admissionNews: admissionNews.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        viewCount: viewCounts[p.id] ?? 0,
      })),
    };
  }
}
