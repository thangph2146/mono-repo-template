import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EntityManager } from '@mikro-orm/core';
import { SessionsService } from '../sessions/sessions.service';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { NotificationKind } from '../entities/notification.entity';
import {
  SocketData,
  type SessionRowDto,
  SocketNotificationPayload,
  userRoom,
  conversationRoom,
  sessionRoom,
  roleRoom,
  SOCKET_PATH,
  MAX_HTTP_BUFFER_SIZE,
} from './socket.types';
import { appConfig } from '../config/app.config';
import {
  mapNotificationToPayload,
  type NotificationLike,
} from './notification-mapper';

const MAX_NOTIFICATIONS_SYNC = 50;

function toNotificationKind(kind: any): NotificationKind {
  const k = String(kind).toUpperCase() as NotificationKind;
  if (Object.values(NotificationKind).includes(k)) return k;
  return NotificationKind.MESSAGE;
}

@WebSocketGateway({
  path: SOCKET_PATH,
  cors: {
    origin: appConfig.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: false,
  maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly em: EntityManager,
    private readonly sessionsService: SessionsService,
  ) {}

  emitSessionRevoked(sessionId: string, reason?: 'account_locked'): void {
    if (!this.server) return;
    this.server
      .to(sessionRoom(sessionId))
      .emit('session:revoked', { sessionId, reason });
  }

  emitSessionUpsert(
    session: SessionRowDto,
    previousStatus: 'active' | 'deleted',
    newStatus: 'active' | 'deleted',
  ): void {
    if (!this.server) return;
    this.server.to(roleRoom('ADMIN')).emit('session:upsert', {
      session,
      previousStatus,
      newStatus,
    });
  }

  emitSessionRemove(
    sessionId: string,
    previousStatus: 'active' | 'deleted',
  ): void {
    if (!this.server) return;
    this.server.to(roleRoom('ADMIN')).emit('session:remove', {
      id: sessionId,
      previousStatus,
    });
  }

  emitNotificationToUser(
    userId: string,
    payload: SocketNotificationPayload,
  ): void {
    if (!this.server) return;
    this.server.to(userRoom(userId)).emit('notification:new', payload);
  }

  emitGroupEvent(
    event: 'group:deleted' | 'group:hard-deleted' | 'group:restored',
    payload: { id: string },
  ): void {
    if (!this.server) return;
    this.server.to(roleRoom('ADMIN')).emit(event, payload);
  }

  emitMessageNew(
    payload: {
      id: string;
      content: string;
      fromUserId: string;
      toUserId?: string | null;
      groupId?: string | null;
      timestamp: number;
      replyToId?: string | null;
      isRead?: boolean;
    },
    targetUserIds: string[],
  ): void {
    if (!this.server || targetUserIds.length === 0) return;
    const eventPayload = {
      id: payload.id,
      content: payload.content,
      fromUserId: payload.fromUserId,
      toUserId: payload.toUserId ?? undefined,
      groupId: payload.groupId ?? undefined,
      timestamp: payload.timestamp,
      replyToId: payload.replyToId ?? undefined,
      isRead: payload.isRead ?? false,
    };
    for (const userId of targetUserIds) {
      this.server.to(userRoom(userId)).emit('message:new', eventPayload);
    }
  }

  emitRoleUpsert(
    role: { id: string },
    previousStatus: 'active' | 'deleted' | null = 'active',
    newStatus: 'active' | 'deleted' = 'active',
  ): void {
    if (!this.server) return;
    this.server.emit('role:upsert', {
      role,
      previousStatus,
      newStatus,
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const auth = client.handshake.auth as SocketData;
    const userId = auth?.userId;
    const role = auth?.role;
    const sessionId = auth?.sessionId;
    const socketId = client.id;
    const em = this.em.fork();

    this.logger.log(
      `Client connected: ${socketId}, userId=${userId ?? 'anonymous'}, role=${role ?? '-'}, sessionId=${sessionId ?? '-'}`,
    );

    if (userId) {
      void client.join(userRoom(userId));
      if (sessionId && typeof sessionId === 'string') {
        try {
          const session = await this.sessionsService.getById(sessionId);
          if (session && session.userId === userId && session.isActive) {
            void client.join(sessionRoom(sessionId));
            this.logger.debug(
              `Socket ${socketId} joined session room ${sessionRoom(sessionId)}`,
            );
          }
        } catch (err) {
          this.logger.warn('Failed to validate sessionId for socket join', err);
        }
      }
      try {
        const list = await em.find(
          Notification,
          { user: userId },
          {
            populate: ['user'],
            orderBy: { createdAt: 'DESC' },
            limit: MAX_NOTIFICATIONS_SYNC,
          },
        );
        const payloads = list.map((item) =>
          mapNotificationToPayload(item as unknown as NotificationLike),
        );
        client.emit('notifications:sync', payloads);
      } catch (err) {
        this.logger.warn('Failed to load notifications for sync', err);
        client.emit('notifications:sync', []);
      }
    }
    if (role) {
      void client.join(roleRoom(role));
      const roleLower = typeof role === 'string' ? role.toLowerCase() : '';
      if (roleLower === 'admin' || roleLower === 'super_admin') {
        void client.join(roleRoom('ADMIN'));
        this.logger.debug(
          `Socket ${socketId} joined role room role:ADMIN (normalized from role:${role})`,
        );
      }
    }
  }

  handleDisconnect(client: Socket): void {
    const auth = client.handshake.auth as SocketData;
    this.logger.log(
      `Client disconnected: ${client.id}, userId=${auth?.userId ?? 'anonymous'}`,
    );
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    client: Socket,
    payload: { a: string; b: string },
  ): void {
    if (payload?.a && payload?.b) {
      const room = conversationRoom(payload.a, payload.b);
      void client.join(room);
      this.logger.debug(`Socket ${client.id} joined ${room}`);
    }
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    client: Socket,
    payload: { a: string; b: string },
  ): void {
    if (payload?.a && payload?.b) {
      const room = conversationRoom(payload.a, payload.b);
      void client.leave(room);
      this.logger.debug(`Socket ${client.id} left ${room}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    client: Socket,
    payload: {
      replyToId?: string;
      content: string;
      fromUserId: string;
      toUserId: string;
    },
    ack?: (res: {
      success?: boolean;
      error?: string;
      messageId?: string;
      notificationId?: string;
    }) => void,
  ): Promise<void> {
    const em = this.em.fork();
    if (!payload?.content || !payload?.fromUserId || !payload?.toUserId) {
      if (typeof ack === 'function') ack({ error: 'Invalid payload' });
      return;
    }
    if (payload.content.length > 10000) {
      if (typeof ack === 'function') ack({ error: 'Message content too long' });
      return;
    }

    const room = conversationRoom(payload.fromUserId, payload.toUserId);
    const description =
      payload.content.length > 50
        ? payload.content.substring(0, 50) + '...'
        : payload.content;
    const metadata = payload.replyToId
      ? { fromUserId: payload.fromUserId, replyToId: payload.replyToId }
      : { fromUserId: payload.fromUserId };

    let createdId: string | null = null;
    let notificationPayload: SocketNotificationPayload;

    try {
      const notif = new Notification();
      notif.user = em.getReference(User, payload.toUserId);
      notif.kind = NotificationKind.MESSAGE;
      notif.title = 'Bạn có tin nhắn mới';
      notif.description = description;
      notif.actionUrl = undefined;
      notif.metadata = metadata;
      em.persist(notif);
      await em.flush();
      const created = await em.findOne(
        Notification,
        { id: notif.id },
        { populate: ['user'] },
      );
      createdId = created!.id;
      notificationPayload = mapNotificationToPayload(
        created as unknown as NotificationLike,
      );
    } catch (err) {
      this.logger.error('Failed to persist notification', err);
      notificationPayload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        kind: 'message',
        title: 'Bạn có tin nhắn mới',
        description,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        replyToId: payload.replyToId,
        timestamp: Date.now(),
        read: false,
      };
    }

    this.server.to(room).emit('message:new', {
      replyToId: payload.replyToId,
      content: payload.content,
      fromUserId: payload.fromUserId,
      toUserId: payload.toUserId,
      timestamp: Date.now(),
    });
    this.server
      .to(userRoom(payload.toUserId))
      .emit('notification:new', notificationPayload);
    this.server.to(roleRoom('ADMIN')).emit('notification:admin', {
      ...notificationPayload,
      title: 'Tin nhắn mới từ sinh viên',
      description: `Sinh viên đã gửi tin nhắn: ${notificationPayload.description}`,
    });

    if (typeof ack === 'function') {
      ack({
        success: true,
        notificationId: createdId ?? notificationPayload.id,
      });
    }
  }

  @SubscribeMessage('notification:read')
  async handleNotificationRead(
    client: Socket,
    payload: { notificationId: string },
  ): Promise<void> {
    const em = this.em.fork();
    const auth = client.handshake.auth as SocketData;
    const userId = auth?.userId;
    if (!userId || !payload?.notificationId) return;

    try {
      const affected = await em.nativeUpdate(
        Notification,
        {
          id: payload.notificationId,
          user: userId,
        },
        { isRead: true, readAt: new Date() },
      );
      if ((affected || 0) === 0) return;

      const n = await em.findOne(
        Notification,
        { id: payload.notificationId },
        { populate: ['user'] },
      );
      if (n) {
        this.server
          .to(userRoom(userId))
          .emit(
            'notification:updated',
            mapNotificationToPayload(n as unknown as NotificationLike),
          );
      }
    } catch (err) {
      this.logger.warn('notification:read failed', err);
    }
  }

  @SubscribeMessage('notifications:mark-all-read')
  async handleMarkAllRead(client: Socket): Promise<void> {
    const em = this.em.fork();
    const auth = client.handshake.auth as SocketData;
    const userId = auth?.userId;
    if (!userId) return;

    try {
      await em.nativeUpdate(
        Notification,
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() },
      );
      const list = await em.find(
        Notification,
        { user: userId },
        {
          populate: ['user'],
          orderBy: { createdAt: 'DESC' },
          limit: MAX_NOTIFICATIONS_SYNC,
        },
      );
      this.server.to(userRoom(userId)).emit(
        'notifications:sync',
        list.map((item) =>
          mapNotificationToPayload(item as unknown as NotificationLike),
        ),
      );
    } catch (err) {
      this.logger.warn('notifications:mark-all-read failed', err);
    }
  }

  @SubscribeMessage('system:notify')
  async handleSystemNotify(
    client: Socket,
    payload: {
      targetUserId?: string;
      targetRole?: string;
      notification: Omit<
        SocketNotificationPayload,
        'id' | 'timestamp' | 'read'
      >;
    },
  ): Promise<void> {
    const em = this.em.fork();
    if (!payload?.notification) return;

    const kind = toNotificationKind(payload.notification.kind ?? 'system');
    const data = {
      title: payload.notification.title,
      description: payload.notification.description ?? undefined,
      actionUrl: payload.notification.actionUrl ?? undefined,
      kind,
      metadata: payload.notification.metadata ?? undefined,
    };

    if (payload.targetUserId) {
      try {
        const notif = new Notification();
        notif.user = em.getReference(User, payload.targetUserId);
        notif.title = data.title;
        notif.description = data.description;
        notif.actionUrl = data.actionUrl;
        notif.kind = data.kind;
        notif.metadata = data.metadata;
        em.persist(notif);
        await em.flush();
        const created = await em.findOne(
          Notification,
          { id: notif.id },
          { populate: ['user'] },
        );
        const notificationPayload: SocketNotificationPayload = {
          ...mapNotificationToPayload(created as unknown as NotificationLike),
          ...payload.notification,
          id: created!.id,
          timestamp: created!.createdAt.getTime(),
          read: false,
        };
        this.server
          .to(userRoom(payload.targetUserId))
          .emit('notification:new', notificationPayload);
      } catch (err) {
        this.logger.warn('system:notify create for user failed', err);
      }
    }

    if (payload.targetRole) {
      try {
        const users = await em.find(
          User,
          {
            isActive: true,
            deletedAt: null,
            userRoles: {
              role: {
                name: payload.targetRole,
                deletedAt: null,
                isActive: true,
              },
            },
          },
          {
            fields: ['id'],
            populate: ['userRoles', 'userRoles.role'],
          },
        );

        if (users.length > 0) {
          for (const u of users) {
            const notif = new Notification();
            notif.user = em.getReference(User, u.id);
            notif.title = data.title;
            notif.description = data.description;
            notif.actionUrl = data.actionUrl;
            notif.kind = data.kind;
            notif.metadata = data.metadata;
            em.persist(notif);
          }
          await em.flush();
        }
        const notificationPayload: SocketNotificationPayload = {
          ...payload.notification,
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        this.server
          .to(roleRoom(payload.targetRole))
          .emit('notification:new', notificationPayload);
      } catch (err) {
        this.logger.warn('system:notify create for role failed', err);
      }
    }
  }
}
