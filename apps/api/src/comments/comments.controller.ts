/**
 * Comments Admin API Controller.
 * GET list, options, :id; DELETE :id; POST :id/restore; DELETE :id/hard-delete; POST bulk; POST :id/approve; POST :id/unapprove.
 * Header: X-User-Id (bắt buộc).
 */
import {
  Controller,
  Get,
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
import { CommentsService } from './comments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type CommentListStatus = 'active' | 'deleted' | 'all';
type CommentBulkAction =
  | 'active'
  | 'unactive'
  | 'delete'
  | 'restore'
  | 'hard-delete';

@Controller(ADMIN_ROUTES.COMMENTS)
export class CommentsController {
  private readonly logger = new Logger(CommentsController.name);
  private readonly listStatuses = new Set<CommentListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<CommentBulkAction>([
    'active',
    'unactive',
    'delete',
    'restore',
    'hard-delete',
  ]);

  constructor(
    private readonly commentsService: CommentsService,
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

  private parseListStatus(status?: string): CommentListStatus {
    if (status && this.listStatuses.has(status as CommentListStatus)) {
      return status as CommentListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is CommentBulkAction {
    return this.bulkActions.has(action as CommentBulkAction);
  }

  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
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

    const result = await this.commentsService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: this.parseListStatus(status),
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

    const options = await this.commentsService.getOptions(
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

    const row = await this.commentsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy bình luận',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
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

    const ok = await this.commentsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bình luận không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa bình luận',
        `Xóa bình luận (soft) id: ${id}`,
        ADMIN_ROUTES.COMMENTS,
        {
          resource: RESOURCES.COMMENTS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa bình luận',
    });
    return res.status(statusCode).json(body);
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

    const ok = await this.commentsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bình luận không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục bình luận',
        `Khôi phục bình luận id: ${id}`,
        `${ADMIN_ROUTES.COMMENTS}/${id}`,
        {
          resource: RESOURCES.COMMENTS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục bình luận',
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

    const ok = await this.commentsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy bình luận',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn bình luận',
        `Xóa vĩnh viễn bình luận id: ${id}`,
        ADMIN_ROUTES.COMMENTS,
        {
          resource: RESOURCES.COMMENTS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn bình luận',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/approve')
  async approve(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const ok = await this.commentsService.approve(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bình luận không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã duyệt bình luận',
        `Duyệt bình luận id: ${id}`,
        `${ADMIN_ROUTES.COMMENTS}/${id}`,
        {
          resource: RESOURCES.COMMENTS,
          action: ACTIONS.APPROVE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã duyệt bình luận',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/unapprove')
  async unapprove(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const ok = await this.commentsService.unapprove(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bình luận không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã bỏ duyệt bình luận',
        `Bỏ duyệt bình luận id: ${id}`,
        `${ADMIN_ROUTES.COMMENTS}/${id}`,
        {
          resource: RESOURCES.COMMENTS,
          action: ACTIONS.UNACTIVE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã bỏ duyệt bình luận',
    });
    return res.status(statusCode).json(body);
  }

  @Post('bulk')
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { action?: string; ids?: string[] },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const action = body?.action;
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (!action || !this.isBulkAction(action)) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action không hợp lệ',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    // Map internal actions
    let mappedAction:
      | 'approve'
      | 'unapprove'
      | 'delete'
      | 'restore'
      | 'hard-delete' = 'delete';
    switch (action) {
      case 'active':
        mappedAction = 'approve';
        break;
      case 'unactive':
        mappedAction = 'unapprove';
        break;
      case 'delete':
        mappedAction = 'delete';
        break;
      case 'restore':
        mappedAction = 'restore';
        break;
      case 'hard-delete':
        mappedAction = 'hard-delete';
        break;
    }

    const result = await this.commentsService.bulk(mappedAction, ids);

    if (userId && result.affected > 0) {
      let actionLabel = '';
      let actionType = '';

      switch (action) {
        case 'active':
          actionLabel = 'Duyệt';
          actionType = ACTIONS.APPROVE;
          break;
        case 'unactive':
          actionLabel = 'Bỏ duyệt';
          actionType = ACTIONS.UNACTIVE;
          break;
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
        `Đã ${actionLabel} ${result.affected} bình luận`,
        `Bulk: ${actionLabel} ${result.affected} bình luận`,
        ADMIN_ROUTES.COMMENTS,
        {
          resource: RESOURCES.COMMENTS,
          action: actionType,
          count: result.affected,
          ids,
        },
      );
    }

    const { statusCode, body: okBody } = createSuccessResponse(
      { affected: result.affected, message: result.message },
      { message: result.message },
    );
    return res.status(statusCode).json(okBody);
  }
}
