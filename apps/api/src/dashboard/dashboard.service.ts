/**
 * Dashboard stats for admin: overview counts, monthlyData, categoryData, topPosts.
 */
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Category } from '../entities/category.entity';
import { Comment } from '../entities/comment.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { PostCategory } from '../entities/post-category.entity';
import { Post } from '../entities/post.entity';
import { Role } from '../entities/role.entity';
import { Session } from '../entities/session.entity';
import { Student } from '../entities/student.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../entities/user.entity';

export interface DashboardOverviewDto {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalCategories: number;
  totalTags: number;
  totalMessages: number;
  totalNotifications: number;
  totalContactRequests: number;
  totalStudents: number;
  totalSessions: number;
  totalRoles: number;
  usersChange: number;
  postsChange: number;
  commentsChange: number;
  categoriesChange: number;
  tagsChange: number;
  messagesChange: number;
  notificationsChange: number;
  contactRequestsChange: number;
  studentsChange: number;
  sessionsChange: number;
  rolesChange: number;
}

export interface DashboardMonthlyItemDto {
  month: string;
  users: number;
  posts: number;
  comments: number;
  categories: number;
  tags: number;
  messages: number;
  notifications: number;
  contactRequests: number;
  students: number;
  sessions: number;
  roles: number;
}

export interface DashboardCategoryItemDto {
  name: string;
  value: number;
  count: number;
  children?: DashboardCategoryItemDto[];
}

export interface DashboardTopPostDto {
  id: string;
  title: string;
  slug: string;
  comments: number;
}

export interface DashboardStatsDto {
  overview: DashboardOverviewDto;
  monthlyData: DashboardMonthlyItemDto[];
  categoryData: DashboardCategoryItemDto[];
  topPosts: DashboardTopPostDto[];
}

const ZERO_CHANGE = {
  usersChange: 0,
  postsChange: 0,
  commentsChange: 0,
  categoriesChange: 0,
  tagsChange: 0,
  messagesChange: 0,
  notificationsChange: 0,
  contactRequestsChange: 0,
  studentsChange: 0,
  sessionsChange: 0,
  rolesChange: 0,
};

@Injectable()
export class DashboardService {
  constructor(private readonly em: EntityManager) {}

  async getStats(): Promise<DashboardStatsDto> {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalCategories,
      totalTags,
      totalMessages,
      totalNotifications,
      totalContactRequests,
      totalStudents,
      totalSessions,
      totalRoles,
    ] = await Promise.all([
      this.em.count(User, { deletedAt: null }),
      this.em.count(Post, { deletedAt: null }),
      this.em.count(Comment, { deletedAt: null }),
      this.em.count(Category, { deletedAt: null }),
      this.em.count(Tag, { deletedAt: null }),
      this.em.count(Message, { deletedAt: null }),
      this.em.count(Notification, {}),
      this.em.count(ContactRequest, { deletedAt: null }),
      this.em.count(Student, { deletedAt: null }),
      this.em.count(Session, { isActive: true }),
      this.em.count(Role, { deletedAt: null }),
    ]);

    const overview: DashboardOverviewDto = {
      totalUsers,
      totalPosts,
      totalComments,
      totalCategories,
      totalTags,
      totalMessages,
      totalNotifications,
      totalContactRequests,
      totalStudents,
      totalSessions,
      totalRoles,
      ...ZERO_CHANGE,
    };

    const [monthlyData, categoryData, topPosts] = await Promise.all([
      this.getMonthlyData(),
      this.getCategoryData(),
      this.getTopPosts(),
    ]);

    return {
      overview,
      monthlyData,
      categoryData,
      topPosts,
    };
  }

  private async getMonthlyData(): Promise<DashboardMonthlyItemDto[]> {
    const now = new Date();
    const months: DashboardMonthlyItemDto[] = [];

    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );
      const monthKey = `${start.getFullYear()}-${String(
        start.getMonth() + 1,
      ).padStart(2, '0')}`;

      const [
        users,
        posts,
        comments,
        categories,
        tags,
        messages,
        notifications,
      ] = await Promise.all([
        this.em.count(User, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Post, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Comment, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Category, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Tag, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Message, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Notification, {
          createdAt: { $gte: start, $lte: end },
        }),
      ]);

      const [contactRequests, students, sessions, roles] = await Promise.all([
        this.em.count(ContactRequest, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Student, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
        this.em.count(Session, {
          createdAt: { $gte: start, $lte: end },
          isActive: true,
        }),
        this.em.count(Role, {
          createdAt: { $gte: start, $lte: end },
          deletedAt: null,
        }),
      ]);

      months.push({
        month: monthKey,
        users,
        posts,
        comments,
        categories,
        tags,
        messages,
        notifications,
        contactRequests,
        students,
        sessions,
        roles,
      });
    }

    return months;
  }

  private async getCategoryData(): Promise<DashboardCategoryItemDto[]> {
    const [totalPosts, allCategories, activePosts] = await Promise.all([
      this.em.count(Post, { deletedAt: null }),
      this.em.find(
        Category,
        { deletedAt: null },
        {
          fields: ['id', 'name', 'parent'],
          orderBy: { name: 'ASC' },
        },
      ),
      this.em.find(Post, { deletedAt: null }, { fields: ['id'] }),
    ]);
    const activePostIds = activePosts.map((p) => p.id);
    const postCategoryRows = await this.em.find(
      PostCategory,
      { post: { id: { $in: activePostIds } } },
      { fields: ['post', 'category'] },
    );

    const byParent = new Map<string | null, typeof allCategories>();
    for (const category of allCategories) {
      const key = category.parent?.id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)?.push(category);
    }

    const depth = new Map<string, number>();
    const setDepth = (id: string, currentDepth: number) => {
      depth.set(id, currentDepth);
      for (const child of byParent.get(id) ?? []) {
        setDepth(child.id, currentDepth + 1);
      }
    };

    for (const root of byParent.get(null) ?? []) {
      setDepth(root.id, 0);
    }

    const postToCategoryIds = new Map<string, string[]>();
    for (const row of postCategoryRows) {
      const pid = row.post.id;
      const cid = row.category.id;
      if (!postToCategoryIds.has(pid)) {
        postToCategoryIds.set(pid, []);
      }
      postToCategoryIds.get(pid)?.push(cid);
    }

    const assignedCount = new Map<string, number>();
    for (const [, categoryIds] of postToCategoryIds) {
      if (!categoryIds.length) continue;

      const deepestId = categoryIds.reduce((current, next) =>
        (depth.get(next) ?? 0) > (depth.get(current) ?? 0) ? next : current,
      );

      assignedCount.set(deepestId, (assignedCount.get(deepestId) ?? 0) + 1);
    }

    const buildNode = (category: {
      id: string;
      name: string;
      parentId?: string | null;
    }): DashboardCategoryItemDto => {
      const childrenRaw = byParent.get(category.id) ?? [];
      const children = childrenRaw.length
        ? childrenRaw.map((child) => buildNode(child))
        : undefined;
      const directCount = assignedCount.get(category.id) ?? 0;
      const childSum =
        children?.reduce((sum, child) => sum + child.count, 0) ?? 0;
      const count = directCount + childSum;
      const value = totalPosts > 0 ? (count / totalPosts) * 100 : 0;

      return {
        name: category.name,
        value: Math.round(value * 10) / 10,
        count,
        children: children?.length ? children : undefined,
      };
    };

    return (byParent.get(null) ?? []).map((root) => buildNode(root));
  }

  private async getTopPosts(limit = 10): Promise<DashboardTopPostDto[]> {
    const rows = (await this.em.getConnection().execute(
      `
      SELECT
        p.id AS id,
        p.title AS title,
        p.slug AS slug,
        COUNT(c.id) AS comments
      FROM posts p
      LEFT JOIN comments c
        ON c.postId = p.id
       AND c.deletedAt IS NULL
      WHERE p.deletedAt IS NULL
      GROUP BY p.id, p.title, p.slug
      ORDER BY comments DESC
      LIMIT ?
      `,
      [limit],
    )) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: typeof row.id === 'string' ? row.id : '',
      title: typeof row.title === 'string' ? row.title : '',
      slug: typeof row.slug === 'string' ? row.slug : '',
      comments:
        typeof row.comments === 'number'
          ? row.comments
          : Number(row.comments ?? 0) || 0,
    }));
  }
}
