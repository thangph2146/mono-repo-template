/**
 * Contact Requests Admin API Controller.
 * GET list, options, :id; PUT :id; POST bulk; POST :id/restore; DELETE :id/hard-delete; DELETE :id; POST :id/assign.
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
import { ContactRequestsService } from './contact-requests.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type ContactListStatus =
  | 'active'
  | 'deleted'
  | 'all'
  | 'NEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';
type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type ContactPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type ContactBulkAction =
  | 'delete'
  | 'restore'
  | 'hard-delete'
  | 'mark-read'
  | 'mark-unread'
  | 'update-status';

@Controller(ADMIN_ROUTES.CONTACT_REQUESTS)
export class ContactRequestsController {
  private readonly logger = new Logger(ContactRequestsController.name);
  private readonly listStatuses = new Set<ContactListStatus>([
    'active',
    'deleted',
    'all',
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ]);
  private readonly contactStatuses = new Set<ContactStatus>([
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ]);
  private readonly priorities = new Set<ContactPriority>([
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT',
  ]);
  private readonly bulkActions = new Set<ContactBulkAction>([
    'delete',
    'restore',
    'hard-delete',
    'mark-read',
    'mark-unread',
    'update-status',
  ]);

  constructor(
    private readonly contactRequestsService: ContactRequestsService,
    private readonly notificationsService: NotificationsService,
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

  private unauthorized(res: Response): Response {
    const { statusCode, body } = createErrorResponse(
      `Thiếu header ${APP_HEADERS.USER_ID}`,
      { status: 401 },
    );
    return res.status(statusCode).json(body);
  }

  private parseListStatus(status?: string): ContactListStatus | undefined {
    if (status && this.listStatuses.has(status as ContactListStatus)) {
      return status as ContactListStatus;
    }
    return undefined;
  }

  private isBulkAction(action: string): action is ContactBulkAction {
    return this.bulkActions.has(action as ContactBulkAction);
  }

  private parseContactStatus(value: unknown): ContactStatus | undefined {
    if (typeof value !== 'string') return undefined;
    return this.contactStatuses.has(value as ContactStatus)
      ? (value as ContactStatus)
      : undefined;
  }

  private parseContactPriority(value: unknown): ContactPriority | undefined {
    if (typeof value !== 'string') return undefined;
    return this.priorities.has(value as ContactPriority)
      ? (value as ContactPriority)
      : undefined;
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private asOptionalNullableString(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === 'string') {
      const t = value.trim();
      return t === '' ? null : t;
    }
    return undefined;
  }

  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('trash') trash?: string,
    @Query() query?: Record<string, string>,
  ) {
    this.logger.log(`list page=${page ?? 1} limit=${limit ?? 10}`);
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

    // Map trash parameter to status
    let listStatus = this.parseListStatus(status);
    if (trash === 'true' || trash === '1') {
      listStatus = 'deleted';
    }

    const result = await this.contactRequestsService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: listStatus,
      filters: Object.keys(filters).length ? filters : undefined,
    });

    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

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

    const options = await this.contactRequestsService.getOptions(
      column ?? '',
      search?.trim(),
      Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
    );
    const { statusCode, body } = createSuccessResponse(options);
    return res.status(statusCode).json(body);
  }

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

    const row = await this.contactRequestsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy yêu cầu liên hệ',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Put(':id')
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const updated = await this.contactRequestsService.update(id, {
      status: this.parseContactStatus(body?.status),
      priority: this.parseContactPriority(body?.priority),
      isRead: typeof body?.isRead === 'boolean' ? body.isRead : undefined,
      assignedToId: this.asOptionalNullableString(body?.assignedToId),
      name: this.asOptionalString(body?.name),
      email: this.asOptionalString(body?.email),
      phone: this.asOptionalNullableString(body?.phone),
      subject: this.asOptionalString(body?.subject),
      content: this.asOptionalString(body?.content),
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy yêu cầu liên hệ',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật yêu cầu liên hệ',
        `Cập nhật yêu cầu liên hệ id: ${updated.id}`,
        `${ADMIN_ROUTES.CONTACT_REQUESTS}/${updated.id}`,
        {
          resource: RESOURCES.CONTACT_REQUESTS,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Post('bulk')
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { action: string; ids?: string[]; status?: string },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const action = body?.action;
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (action === 'update-status') {
      const parsedStatus = this.parseContactStatus(body?.status);
      if (!parsedStatus) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Status không hợp lệ',
          { status: 400 },
        );
        return res.status(statusCode).json(errBody);
      }
      const result = await this.contactRequestsService.bulk(
        'update-status',
        ids,
        parsedStatus,
      );
      if (userId && result.affectedCount > 0) {
        this.logActivity(
          userId,
          `Đã cập nhật trạng thái cho ${result.affectedCount} yêu cầu liên hệ`,
          `Bulk: Cập nhật trạng thái thành ${body.status}, ${result.affectedCount} yêu cầu`,
          ADMIN_ROUTES.CONTACT_REQUESTS,
          {
            resource: RESOURCES.CONTACT_REQUESTS,
            action: ACTIONS.UPDATE,
            count: result.affectedCount,
            ids,
            status: body.status,
          },
        );
      }
      const { statusCode, body: okBody } = createSuccessResponse(
        { data: { affected: result.affectedCount }, message: result.message },
        { message: result.message },
      );
      return res.status(statusCode).json(okBody);
    }

    if (!action || !this.isBulkAction(action) || action === 'update-status') {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action không hợp lệ',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    const result = await this.contactRequestsService.bulk(action, ids);
    const affected = result.affectedCount ?? 0;
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
        case 'mark-read':
          actionLabel = 'Đánh dấu đã đọc';
          actionType = ACTIONS.UPDATE;
          break;
        case 'mark-unread':
          actionLabel = 'Đánh dấu chưa đọc';
          actionType = ACTIONS.UPDATE;
          break;
      }

      this.logActivity(
        userId,
        `Đã thực hiện bulk ${actionLabel} trên ${affected} yêu cầu liên hệ`,
        `Bulk: ${actionLabel}, ${affected} yêu cầu`,
        ADMIN_ROUTES.CONTACT_REQUESTS,
        {
          resource: RESOURCES.CONTACT_REQUESTS,
          action: actionType,
          count: affected,
          ids,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(
      { affected: result.affectedCount, message: result.message },
      { message: result.message },
    );
    return res.status(statusCode).json(okBody);
  }

  @Post(':id/restore')
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const ok = await this.contactRequestsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Yêu cầu liên hệ không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục yêu cầu liên hệ',
        `Khôi phục yêu cầu liên hệ id: ${id}`,
        `${ADMIN_ROUTES.CONTACT_REQUESTS}/${id}`,
        {
          resource: RESOURCES.CONTACT_REQUESTS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục yêu cầu liên hệ',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id/hard-delete')
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const ok = await this.contactRequestsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy yêu cầu liên hệ',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn yêu cầu liên hệ',
        `Xóa vĩnh viễn yêu cầu liên hệ id: ${id}`,
        ADMIN_ROUTES.CONTACT_REQUESTS,
        {
          resource: RESOURCES.CONTACT_REQUESTS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn yêu cầu liên hệ',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const ok = await this.contactRequestsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Yêu cầu liên hệ không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa yêu cầu liên hệ',
        `Xóa yêu cầu liên hệ (soft) id: ${id}`,
        ADMIN_ROUTES.CONTACT_REQUESTS,
        {
          resource: RESOURCES.CONTACT_REQUESTS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa yêu cầu liên hệ',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/assign')
  async assign(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: { assignedToId?: string | null },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const rawAssign = body?.assignedToId;
    const assigneeId =
      rawAssign == null
        ? null
        : typeof rawAssign === 'string' && rawAssign.trim() === ''
          ? null
          : String(rawAssign).trim();

    const updated = await this.contactRequestsService.assign(id, assigneeId);
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy yêu cầu liên hệ',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }
}
