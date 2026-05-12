/**
 * Comments Admin API Service.
 * List, options, getById, softDelete, restore, hardDelete, bulk (approve, unapprove, delete, restore, hard-delete).
 */
import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import { Comment } from '../entities/comment.entity';

export interface CommentRowDto {
  id: string;
  content: string;
  approved: boolean;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  postTitle: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListCommentsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListCommentsResult {
  data: CommentRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapRow(r: Comment): CommentRowDto {
  return {
    id: r.id,
    content: r.content,
    approved: r.approved,
    authorId: r.author?.id ?? '',
    authorName: r.author?.name ?? null,
    authorEmail: r.author?.email ?? '',
    postTitle: r.post?.title ?? '',
    postId: r.post?.id ?? '',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt?.toISOString() ?? null,
  };
}

function buildWhere(params: ListCommentsParams): Record<string, unknown> {
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
      { content: { $like: q } },
      { author: { name: { $like: q } } },
      { author: { email: { $like: q } } },
      { post: { title: { $like: q } } },
    ];
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const trimmed = value.trim();

      if (key === 'content') {
        where.content = { $like: `%${trimmed}%` };
      } else if (key === 'authorName') {
        where.author = { name: { $like: `%${trimmed}%` } };
      } else if (key === 'authorEmail') {
        where.author = { email: { $like: `%${trimmed}%` } };
      } else if (key === 'postTitle') {
        where.post = { title: { $like: `%${trimmed}%` } };
      } else if (key === 'postId') {
        where.post = trimmed;
      } else if (key === 'authorId') {
        where.author = trimmed;
      } else if (key === 'approved') {
        where.approved = trimmed === 'true';
      }
    }
  }

  return where;
}

@Injectable()
export class CommentsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListCommentsParams): Promise<ListCommentsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where = buildWhere(params) as FilterQuery<Comment>;

    const [rows, total] = await Promise.all([
      this.em.find(Comment, where, {
        populate: ['author', 'post'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Comment, where),
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
    const where: Record<string, unknown> = { deletedAt: null };
    if (search?.trim()) {
      const q = search.trim();
      if (column === 'content') where.content = { $like: `%${q}%` };
      else if (column === 'authorName')
        where.author = { name: { $like: `%${q}%` } };
      else if (column === 'authorEmail')
        where.author = { email: { $like: `%${q}%` } };
      else if (column === 'postTitle')
        where.post = { title: { $like: `%${q}%` } };
      else where.content = { $like: `%${q}%` };
    }
    const rows = await this.em.find(Comment, where as FilterQuery<Comment>, {
      populate: ['author', 'post'],
      limit,
    });

    const optionsMap = new Map<string, string>();
    for (const item of rows) {
      let value: string | null = null;
      let label: string | null = null;

      if (column === 'content') {
        value = item.content;
        label =
          item.content.length > 50
            ? `${item.content.substring(0, 50)}...`
            : item.content;
      } else if (column === 'authorName') {
        value = item.author?.name || item.author?.email || '';
        label = value;
      } else if (column === 'authorEmail') {
        value = item.author?.email || '';
        label = value;
      } else if (column === 'postTitle') {
        value = item.post?.title || '';
        label = value;
      }

      if (value && !optionsMap.has(value)) {
        optionsMap.set(value, label || value);
      }
    }

    return Array.from(optionsMap.entries()).map(([value, label]) => ({
      label,
      value,
    }));
  }

  async getById(id: string): Promise<CommentRowDto | null> {
    const row = await this.em.findOne(
      Comment,
      { id },
      { populate: ['author', 'post'] },
    );
    return row ? mapRow(row) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(Comment, { id });
    if (!row || row.deletedAt) return false;

    row.deletedAt = new Date();
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const row = await this.em.findOne(Comment, { id });
    if (!row || !row.deletedAt) return false;

    row.deletedAt = null;
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const row = await this.em.findOne(Comment, { id });
    if (!row) return false;

    this.em.remove(row);
    await this.em.flush();
    return true;
  }

  async approve(id: string): Promise<boolean> {
    const row = await this.em.findOne(Comment, { id });
    if (!row || row.deletedAt) return false;

    row.approved = true;
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async unapprove(id: string): Promise<boolean> {
    const row = await this.em.findOne(Comment, { id });
    if (!row || row.deletedAt) return false;

    row.approved = false;
    this.em.persist(row);
    await this.em.flush();
    return true;
  }

  async bulk(
    action: 'approve' | 'unapprove' | 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };

    if (action === 'approve') {
      const result = await this.em.nativeUpdate(
        Comment,
        { id: { $in: ids }, deletedAt: null, approved: false },
        { approved: true },
      );
      return {
        affected: result ?? 0,
        message: `Đã duyệt ${result ?? 0} bình luận`,
      };
    }

    if (action === 'unapprove') {
      const result = await this.em.nativeUpdate(
        Comment,
        { id: { $in: ids }, deletedAt: null, approved: true },
        { approved: false },
      );
      return {
        affected: result ?? 0,
        message: `Đã bỏ duyệt ${result ?? 0} bình luận`,
      };
    }

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Comment,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} bình luận`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Comment,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} bình luận`,
      };
    }

    if (action === 'hard-delete') {
      const result = await this.em.nativeDelete(Comment, {
        id: { $in: ids },
      });
      return {
        affected: result ?? 0,
        message: `Đã xóa vĩnh viễn ${result ?? 0} bình luận`,
      };
    }

    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
