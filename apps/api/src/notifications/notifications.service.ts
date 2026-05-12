import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import {
  Notification,
  NotificationKind,
} from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Message, MessageType } from '../entities/message.entity';
import { ContactRequest } from '../entities/contact-request.entity';

export interface NotificationsListQuery {
  userId: string;
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  mine?: boolean;
}

export interface NotificationItemDto {
  id: string;
  userId: string;
  kind: string;
  title: string;
  description: string | null;
  isRead: boolean;
  actionUrl: string | null;
  metadata: Record<string, unknown> | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  readAt: Date | null;
}

export interface NotificationsListResult {
  notifications: NotificationItemDto[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface UnreadCountsResult {
  unreadNotifications: number;
  unreadMessages: number;
  contactRequests: number;
}

/** Row cho bảng admin notifications (có userEmail, userName) */
export interface AdminTableRowDto extends NotificationItemDto {
  userEmail: string | null;
  userName: string | null;
}

export interface AdminTableQuery {
  userId: string;
  viewAll?: boolean;
  page: number;
  limit: number;
  search?: string;
  filters?: Record<string, string>;
}

export interface AdminTableResult {
  data: AdminTableRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type NotificationWithUser = Notification & {
  user?: Pick<User, 'id' | 'name' | 'email'> | null;
};

function relationId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as { id?: unknown }).id === 'string'
  ) {
    const id = (value as { id: string }).id.trim();
    return id || null;
  }
  return null;
}

function mapRow(n: NotificationWithUser): NotificationItemDto {
  return {
    id: n.id,
    userId: relationId(n.user) ?? '',
    kind: n.kind,
    title: n.title,
    description: n.description ?? null,
    isRead: n.isRead,
    actionUrl: n.actionUrl ?? null,
    metadata: n.metadata ?? null,
    expiresAt: n.expiresAt ?? null,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    readAt: n.readAt ?? null,
  };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Danh sách userId có role super_admin (dùng để gửi thông báo đăng nhập).
   */
  async getSuperAdminUserIds(): Promise<string[]> {
    const rows = await this.em.find(
      UserRole,
      { role: { name: 'super_admin' } },
      { populate: ['role', 'user'], fields: ['user'] },
    );
    return [
      ...new Set(
        rows
          .map((r) => relationId(r.user))
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
  }

  /**
   * Kiểm tra đã có thông báo "Tài khoản đăng nhập" gửi cho recipientUserId với cùng description trong khoảng thời gian gần đây (tránh trùng khi API tạo session bị gọi 2 lần).
   */
  async hasRecentLoginNotification(
    recipientUserId: string,
    description: string,
    withinLastMs: number = 60_000,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinLastMs);
    const existing = await this.em.findOne(Notification, {
      user: recipientUserId,
      title: 'Tài khoản đăng nhập',
      description,
      createdAt: { $gte: since },
    });
    return existing != null;
  }

  /**
   * Kiểm tra đã có thông báo "Chào mừng bạn trở lại" gửi cho userId trong khoảng thời gian gần đây
   * (tránh trùng khi API tạo session bị gọi 2 lần).
   */
  async hasRecentWelcomeBackNotification(
    userId: string,
    withinLastMs: number = 60_000,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinLastMs);
    const existing = await this.em.findOne(Notification, {
      user: userId,
      kind: NotificationKind.SYSTEM,
      title: 'Chào mừng bạn trở lại',
      createdAt: { $gte: since },
    });
    return existing != null;
  }

  /**
   * Tạo thông báo lưu trữ (activity log) khi admin/user thực hiện action.
   * Dùng để super admin và người dùng theo dõi lịch sử hoạt động tại /admin/notifications.
   */
  async create(data: {
    userId: string;
    kind: NotificationKind;
    title: string;
    description?: string | null;
    actionUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<NotificationItemDto> {
    const entity = new Notification();
    entity.user = this.em.getReference(User, data.userId);
    entity.kind = data.kind;
    entity.title = data.title;
    entity.description = data.description ?? null;
    entity.actionUrl = data.actionUrl ?? null;
    entity.metadata = data.metadata ?? null;
    this.em.persist(entity);
    await this.em.flush();
    return mapRow(entity as NotificationWithUser);
  }

  async list(query: NotificationsListQuery): Promise<NotificationsListResult> {
    const { userId, limit = 20, offset = 0, unreadOnly = false } = query;

    const where: Record<string, unknown> = { user: userId };
    if (unreadOnly) where.isRead = false;
    const whereQuery = where as FilterQuery<Notification>;

    const [notifications, total, unreadCount] = await Promise.all([
      this.em.find(Notification, whereQuery, {
        orderBy: { createdAt: 'DESC' },
        limit: Math.min(limit, 100),
        offset,
      }),
      this.em.count(Notification, whereQuery),
      this.em.count(Notification, { user: userId, isRead: false }),
    ]);

    const items: NotificationItemDto[] = notifications.map((n) => ({
      id: n.id,
      userId: relationId(n.user) ?? '',
      kind: n.kind,
      title: n.title,
      description: n.description ?? null,
      isRead: n.isRead,
      actionUrl: n.actionUrl ?? null,
      metadata: n.metadata as Record<string, unknown> | null,
      expiresAt: n.expiresAt ?? null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      readAt: n.readAt ?? null,
    }));

    return {
      notifications: items,
      total,
      unreadCount,
      hasMore: offset + notifications.length < total,
    };
  }

  async getUnreadCounts(userId: string): Promise<UnreadCountsResult> {
    const [unreadNotifications, personalUnread, groupUnread, contactRequests] =
      await Promise.all([
        this.em.count(Notification, { user: userId, isRead: false }),
        // Tin nhắn cá nhân chưa đọc (receiver = userId, isRead = false)
        this.em.count(Message, {
          type: MessageType.PERSONAL,
          receiver: userId,
          isRead: false,
          deletedAt: null,
        }),
        // Tin nhắn nhóm chưa đọc: message trong nhóm user tham gia, không phải do user gửi, chưa có MessageRead
        this.em.count(Message, {
          group: { $ne: null },
          deletedAt: null,
          sender: { $ne: userId },
        }),
        this.em.count(ContactRequest, { isRead: false, deletedAt: null }),
      ]);

    const unreadMessages = personalUnread + groupUnread;

    return {
      unreadNotifications,
      unreadMessages,
      contactRequests,
    };
  }

  async markRead(
    notificationId: string,
    userId: string,
    isRead: boolean,
  ): Promise<NotificationItemDto | null> {
    const n = await this.em.findOne(Notification, {
      id: notificationId,
      user: userId,
    });
    if (!n) return null;

    await this.em.nativeUpdate(
      Notification,
      { id: notificationId },
      { isRead, readAt: isRead ? new Date() : null },
    );

    const updated = await this.em.findOne(Notification, { id: notificationId });
    if (!updated) return null;

    return mapRow(updated as NotificationWithUser);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.em.nativeUpdate(
      Notification,
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { count: result ?? 0 };
  }

  /**
   * Bulk mark as read/unread. Chỉ cập nhật notifications thuộc userId.
   */
  async bulkMarkReadUnread(
    userId: string,
    action: 'mark-read' | 'mark-unread',
    ids: string[],
  ): Promise<{ count: number; alreadyAffected?: number }> {
    if (ids.length === 0) {
      return { count: 0, alreadyAffected: 0 };
    }
    const isRead = action === 'mark-read';
    const updated = await this.em.nativeUpdate(
      Notification,
      { id: { $in: ids }, user: userId, isRead: !isRead },
      { isRead, readAt: isRead ? new Date() : null },
    );
    return {
      count: updated ?? 0,
      alreadyAffected: ids.length - (updated ?? 0),
    };
  }

  /**
   * Bulk delete. Chỉ xóa notifications thuộc userId.
   */
  async bulkDelete(userId: string, ids: string[]): Promise<{ count: number }> {
    if (ids.length === 0) {
      return { count: 0 };
    }
    const result = await this.em.nativeDelete(Notification, {
      id: { $in: ids },
      user: userId,
    });
    return { count: result ?? 0 };
  }

  /**
   * Xóa một notification. Chỉ xóa được nếu thuộc userId.
   */
  async deleteOne(notificationId: string, userId: string): Promise<boolean> {
    const n = await this.em.findOne(Notification, {
      id: notificationId,
      user: userId,
    });
    if (!n) return false;
    await this.em.nativeDelete(Notification, { id: notificationId });
    return true;
  }

  /**
   * Danh sách notifications cho bảng admin (page, limit, search, filters).
   * viewAll = true: lấy tất cả; viewAll = false: chỉ của userId.
   */
  async listForAdminTable(query: AdminTableQuery): Promise<AdminTableResult> {
    const { userId, viewAll = false, page, limit, search, filters } = query;
    const skip = (page - 1) * limit;
    const take = Math.min(Math.max(1, limit), 100);

    const where: Record<string, unknown> = {};
    if (!viewAll) {
      where.user = userId;
    }
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where.$or = [
        { title: { $like: term } },
        { description: { $like: term } },
        { user: { email: { $like: term } } },
        { user: { name: { $like: term } } },
      ];
    }
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        const v = value?.trim();
        if (!v) continue;
        if (key === 'userEmail') {
          where.user = { ...(where.user || {}), email: v };
        } else if (key === 'userName') {
          where.user = { ...(where.user || {}), name: v };
        } else if (key === 'kind') {
          where.kind = v;
        } else if (key === 'isRead') {
          where.isRead = v === 'true';
        }
      }
    }
    const whereQuery = where as FilterQuery<Notification>;

    const [rows, total] = await Promise.all([
      this.em.find(Notification, whereQuery, {
        populate: ['user'],
        orderBy: { createdAt: 'DESC' },
        offset: skip,
        limit: take,
      }),
      this.em.count(Notification, whereQuery),
    ]);

    const data: AdminTableRowDto[] = rows.map((n) => ({
      id: n.id,
      userId: relationId(n.user) ?? '',
      kind: n.kind,
      title: n.title,
      description: n.description ?? null,
      isRead: n.isRead,
      actionUrl: n.actionUrl ?? null,
      metadata: n.metadata as Record<string, unknown> | null,
      expiresAt: n.expiresAt ?? null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      readAt: n.readAt ?? null,
      userEmail:
        n.user &&
        typeof n.user === 'object' &&
        'email' in n.user &&
        typeof (n.user as { email?: unknown }).email === 'string'
          ? (n.user as { email: string }).email
          : null,
      userName:
        n.user &&
        typeof n.user === 'object' &&
        'name' in n.user &&
        (typeof (n.user as { name?: unknown }).name === 'string' ||
          (n.user as { name?: unknown }).name == null)
          ? ((n.user as { name?: string | null }).name ?? null)
          : null,
    }));

    const totalPages = Math.ceil(total / take) || 1;

    return {
      data,
      pagination: {
        page,
        limit: take,
        total,
        totalPages,
      },
    };
  }

  /**
   * Lấy options cho filter cột (userEmail, userName) - users có notification.
   */
  async getColumnOptions(
    column: 'userEmail' | 'userName',
    search?: string,
    limit: number = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    const dbColumn = column === 'userEmail' ? 'email' : 'name';
    const where: Record<string, unknown> = { notifications: { $ne: null } };
    if (search?.trim()) {
      where[dbColumn] = { $like: `%${search.trim()}%` };
    }
    const users = await this.em.find(User, where as FilterQuery<User>, {
      fields: [dbColumn],
      limit: Math.min(limit, 100),
    });
    const seen = new Set<string>();
    return users
      .map((u) => u[dbColumn as keyof typeof u])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .filter((v) => {
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      })
      .map((value) => ({ label: value, value }));
  }
}
