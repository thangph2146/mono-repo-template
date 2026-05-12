/**
 * Sessions API cho admin: list, options, get, update, delete, restore, hard-delete, bulk.
 * Header: X-User-Id (bắt buộc).
 */
import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { SessionsService } from './sessions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import { SocketGateway } from '../socket/socket.gateway';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

@Controller(ADMIN_ROUTES.SESSIONS)
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly notificationsService: NotificationsService,
    private readonly socketGateway: SocketGateway,
  ) {}

  private logActivity(
    userId: string,
    title: string,
    description: string,
    actionUrl?: string,
    metadata?: Record<string, unknown>,
  ): void {
    void this.notificationsService
      .create({
        userId,
        kind: NotificationKind.SYSTEM,
        title,
        description,
        actionUrl: actionUrl ?? null,
        metadata: metadata ?? undefined,
      })
      .catch(() => {});
  }

  private getUserId(
    headers: Record<string, string | undefined>,
  ): string | null {
    const id = headers[APP_HEADERS.USER_ID]?.trim();
    return id || null;
  }

  private buildErrorDetails(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack ?? null,
      };
    }
    return {
      message:
        typeof error === 'string'
          ? error
          : (() => {
              try {
                return JSON.stringify(error);
              } catch {
                return String(error);
              }
            })(),
      stack: null,
    };
  }

  private logApiWarning(
    api: string,
    message: string,
    error: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    const details = {
      api,
      message,
      ...this.buildErrorDetails(error),
      metadata: metadata ?? null,
    };
    this.logger.warn(JSON.stringify(details));
  }

  private unauthorized(
    res: Response,
    headerName: string = APP_HEADERS.USER_ID,
  ): Response {
    const { statusCode, body } = createErrorResponse(
      `Thiếu header ${headerName}`,
      {
        status: 401,
      },
    );
    return res.status(statusCode).json(body);
  }

  /**
   * GET /api/admin/sessions - List sessions
   */
  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'deleted' | 'all',
    @Query() query?: Record<string, string>,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const filters: Record<string, string> = {};
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        const match = key.match(/^filter\[(.+)\]$/);
        if (match && value) filters[match[1]] = value;
      }
    }

    const result = await this.sessionsService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: status === 'deleted' || status === 'all' ? status : 'active',
      filters: Object.keys(filters).length ? filters : undefined,
    });

    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  /**
   * GET /api/admin/sessions/accounts - Danh sách tài khoản (user) kèm trạng thái đăng nhập.
   * Trả về một dòng per user: id, email, name, isActive, hasActiveSession.
   */
  @Get('accounts')
  async listAccounts(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'deleted' | 'all',
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const result = await this.sessionsService.listAccountsWithSessionStatus({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: status ?? 'active',
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });

    return res.status(statusCode).json(body);
  }

  /**
   * POST /api/admin/sessions - Create session (sau khi login, từ admin create-session)
   * Body: { userId, userAgent?, ipAddress? }. Header: X-User-Id (người đang đăng nhập).
   */
  @Post()
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      userId?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
  ) {
    const actorId = this.getUserId(headers);
    if (!actorId) {
      return this.unauthorized(res, 'X-User-Id');
    }
    const userId = body?.userId?.trim();
    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Thiếu userId trong body',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const session = await this.sessionsService.create({
      userId,
      email: body?.email?.trim() || null,
      name: body?.name?.trim() || null,
      avatar: body?.image?.trim() || null,
      userAgent: body?.userAgent ?? null,
      ipAddress: body?.ipAddress ?? null,
    });
    if (!session) {
      const { statusCode, body: errBody } = createErrorResponse(
        'User không tồn tại',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    this.socketGateway.emitSessionUpsert(session, 'deleted', 'active');
    const loginLabel = session.userName || session.userEmail || session.userId;
    const loginDescription = `${loginLabel} đã đăng nhập vào hệ thống.`;
    try {
      const superAdminIds =
        await this.notificationsService.getSuperAdminUserIds();
      for (const superAdminId of superAdminIds) {
        if (superAdminId === session.userId) continue;
        const alreadySent =
          await this.notificationsService.hasRecentLoginNotification(
            superAdminId,
            loginDescription,
            60_000,
          );
        if (alreadySent) continue;
        const notif = await this.notificationsService.create({
          userId: superAdminId,
          kind: NotificationKind.SYSTEM,
          title: 'Tài khoản đăng nhập',
          description: loginDescription,
          actionUrl: ADMIN_ROUTES.SESSIONS,
          metadata: { loggedInUserId: session.userId },
        });
        if (notif) {
          this.socketGateway.emitNotificationToUser(superAdminId, {
            id: notif.id,
            kind: 'info',
            title: notif.title,
            description: notif.description,
            toUserId: superAdminId,
            timestamp: notif.createdAt.getTime(),
            read: false,
            actionUrl: notif.actionUrl,
          });
        }
      }
    } catch (error) {
      this.logApiWarning(
        'POST /api/admin/sessions',
        'Bỏ qua lỗi gửi thông báo đăng nhập',
        error,
        {
          actorId,
          sessionUserId: session.userId,
        },
      );
    }
    if (actorId === session.userId) {
      try {
        const alreadyWelcome =
          await this.notificationsService.hasRecentWelcomeBackNotification(
            session.userId,
            60_000,
          );
        if (!alreadyWelcome) {
          const welcomeNotif = await this.notificationsService.create({
            userId: session.userId,
            kind: NotificationKind.SYSTEM,
            title: 'Chào mừng bạn trở lại',
            description: 'Chúc bạn làm việc hiệu quả.',
            actionUrl: ADMIN_ROUTES.DASHBOARD,
            metadata: { sessionId: session.id },
          });
          if (welcomeNotif) {
            this.socketGateway.emitNotificationToUser(session.userId, {
              id: welcomeNotif.id,
              kind: 'success',
              title: welcomeNotif.title,
              description: welcomeNotif.description,
              toUserId: session.userId,
              timestamp: welcomeNotif.createdAt.getTime(),
              read: false,
              actionUrl: welcomeNotif.actionUrl ?? undefined,
            });
          }
        }
      } catch (error) {
        this.logApiWarning(
          'POST /api/admin/sessions',
          'Bỏ qua lỗi gửi thông báo chào mừng',
          error,
          {
            actorId,
            sessionUserId: session.userId,
            sessionId: session.id,
          },
        );
      }
    }
    if (actorId && actorId !== session.userId) {
      this.logActivity(
        actorId,
        'Đã tạo phiên đăng nhập',
        `Tạo phiên cho ${loginLabel}`,
        `${ADMIN_ROUTES.SESSIONS}/${session.id}`,
        {
          resource: RESOURCES.SESSIONS,
          action: ACTIONS.CREATE,
          resourceId: session.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(session, {
      message: 'Session created successfully',
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  /**
   * GET /api/admin/sessions/options - Column options
   */
  @Get('options')
  async options(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('column') column?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const options = await this.sessionsService.getOptions(
      column ?? '',
      search?.trim(),
      Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
    );
    const { statusCode, body } = createSuccessResponse(options);
    return res.status(statusCode).json(body);
  }

  /**
   * POST /api/admin/sessions/revoke-by-user/:userId - Cưỡng chế đăng xuất mọi phiên của user.
   * Không cho phép: (1) cưỡng chế đăng xuất chính mình, (2) cưỡng chế đăng xuất tài khoản Super Admin.
   */
  @Post('revoke-by-user/:userId')
  async revokeByUser(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('userId') targetUserId: string,
  ) {
    const actorId = this.getUserId(headers);
    if (!actorId) {
      return this.unauthorized(res);
    }
    const userId = targetUserId?.trim();
    if (!userId) {
      const { statusCode, body } = createErrorResponse('Thiếu userId', {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }
    if (userId === actorId) {
      const { statusCode, body } = createErrorResponse(
        'Không thể cưỡng chế đăng xuất chính mình',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }
    const isSuperAdmin =
      await this.sessionsService.userHasSuperAdminRole(userId);
    if (isSuperAdmin) {
      const { statusCode, body } = createErrorResponse(
        'Không thể cưỡng chế đăng xuất tài khoản Super Admin',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }
    const { count, sessionIds } =
      await this.sessionsService.revokeAllSessionsByUserId(userId);
    for (const sessionId of sessionIds) {
      this.socketGateway.emitSessionRevoked(sessionId);
      this.socketGateway.emitSessionRemove(sessionId, 'active');
    }
    this.logActivity(
      actorId,
      'Đã cưỡng chế đăng xuất',
      `Thu hồi ${count} phiên của user ${userId}`,
      ADMIN_ROUTES.SESSIONS,
      {
        resource: RESOURCES.SESSIONS,
        action: ACTIONS.REVOKE_BY_USER,
        targetUserId: userId,
        count,
      },
    );
    const { statusCode, body } = createSuccessResponse(
      { count, message: `Đã thu hồi ${count} phiên đăng nhập` },
      { status: 200 },
    );
    return res.status(statusCode).json(body);
  }

  /**
   * GET /api/admin/sessions/:id
   */
  @Get(':id')
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const session = await this.sessionsService.getById(id);
    if (!session) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy session',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(session);
    return res.status(statusCode).json(body);
  }

  /**
   * PUT /api/admin/sessions/:id
   */
  @Put(':id')
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      isActive?: boolean;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }

    const updated = await this.sessionsService.update(id, {
      isActive: body?.isActive,
      userAgent: body?.userAgent,
      ipAddress: body?.ipAddress,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy session',
        {
          status: 404,
        },
      );
      return res.status(statusCode).json(errBody);
    }
    if (body?.isActive === false) {
      this.socketGateway.emitSessionRevoked(id);
      this.socketGateway.emitSessionUpsert(updated, 'active', 'deleted');
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật phiên',
        `Cập nhật phiên id: ${updated.id}`,
        `${ADMIN_ROUTES.SESSIONS}/${updated.id}`,
        {
          resource: RESOURCES.SESSIONS,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  /**
   * DELETE /api/admin/sessions/:id - Soft delete
   */
  @Delete(':id')
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }

    const ok = await this.sessionsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Session không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    this.socketGateway.emitSessionRevoked(id);
    const row = await this.sessionsService.getById(id);
    if (row) {
      this.socketGateway.emitSessionUpsert(row, 'active', 'deleted');
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa phiên',
        `Xóa phiên (soft) id: ${id}`,
        ADMIN_ROUTES.SESSIONS,
        {
          resource: RESOURCES.SESSIONS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa session',
    });
    return res.status(statusCode).json(body);
  }

  /**
   * POST /api/admin/sessions/bulk - phải khai báo trước :id/restore
   */
  @Post('bulk')
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: { action: 'delete' | 'restore' | 'hard-delete'; ids: string[] },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }

    const action = body?.action;
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!action || !['delete', 'restore', 'hard-delete'].includes(action)) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action không hợp lệ',
        {
          status: 400,
        },
      );
      return res.status(statusCode).json(errBody);
    }

    const result = await this.sessionsService.bulk(action, ids);
    const affected = result.affectedCount ?? 0;
    if (action === 'delete' && affected > 0) {
      for (const sessionId of ids) {
        this.socketGateway.emitSessionRevoked(sessionId);
        this.socketGateway.emitSessionRemove(sessionId, 'active');
      }
    }
    if (action === 'restore' && affected > 0) {
      for (const sessionId of ids) {
        const row = await this.sessionsService.getById(sessionId);
        if (row) {
          this.socketGateway.emitSessionUpsert(row, 'deleted', 'active');
        }
      }
    }
    if (action === 'hard-delete' && affected > 0) {
      for (const sessionId of ids) {
        this.socketGateway.emitSessionRemove(sessionId, 'deleted');
      }
    }
    if (userId && affected > 0) {
      let actionLabel = '';
      let actionType = '';

      switch (action) {
        case 'delete':
          actionLabel = 'Xóa';
          actionType = ACTIONS.DELETE;
          break;
        case 'restore':
          actionLabel = 'Khôi phục';
          actionType = ACTIONS.RESTORE;
          break;
        case 'hard-delete':
          actionLabel = 'Xóa vĩnh viễn';
          actionType = ACTIONS.HARD_DELETE;
          break;
      }

      this.logActivity(
        userId,
        `Đã ${actionLabel} ${affected} phiên`,
        `Bulk: ${actionLabel} ${affected} phiên`,
        ADMIN_ROUTES.SESSIONS,
        {
          resource: RESOURCES.SESSIONS,
          action: actionType,
          count: affected,
          ids,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(
      { affectedCount: result.affectedCount ?? 0, message: result.message },
      { message: result.message },
    );
    return res.status(statusCode).json(okBody);
  }

  /**
   * POST /api/admin/sessions/:id/restore
   */
  @Post(':id/restore')
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }

    const ok = await this.sessionsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Session không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const restored = await this.sessionsService.getById(id);
    if (restored) {
      this.socketGateway.emitSessionUpsert(restored, 'deleted', 'active');
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục phiên',
        `Khôi phục phiên id: ${id}`,
        `${ADMIN_ROUTES.SESSIONS}/${id}`,
        {
          resource: RESOURCES.SESSIONS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục session',
    });
    return res.status(statusCode).json(body);
  }

  /**
   * DELETE /api/admin/sessions/:id/hard-delete
   */
  @Delete(':id/hard-delete')
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }

    const ok = await this.sessionsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy session',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    this.socketGateway.emitSessionRemove(id, 'deleted');
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn phiên',
        `Xóa vĩnh viễn phiên id: ${id}`,
        ADMIN_ROUTES.SESSIONS,
        {
          resource: RESOURCES.SESSIONS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn session',
    });
    return res.status(statusCode).json(body);
  }
}
