/**
 * Tags Admin API Controller.
 * GET list, options, :id; POST (create); PUT :id; POST bulk; DELETE :id/hard-delete; DELETE :id (soft); POST :id/restore.
 * Header: X-User-Id (bắt buộc).
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { TagsService } from './tags.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type TagListStatus = 'active' | 'deleted' | 'all';
type TagBulkAction = 'delete' | 'restore' | 'hard-delete';

@Controller(ADMIN_ROUTES.TAGS)
export class TagsController {
  private readonly logger = new Logger(TagsController.name);
  private readonly listStatuses = new Set<TagListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<TagBulkAction>([
    'delete',
    'restore',
    'hard-delete',
  ]);

  constructor(
    private readonly tagsService: TagsService,
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
    const { statusCode, body } = createErrorResponse('Thiếu header X-User-Id', {
      status: 401,
    });
    return res.status(statusCode).json(body);
  }

  private parseListStatus(status?: string): TagListStatus {
    if (status && this.listStatuses.has(status as TagListStatus)) {
      return status as TagListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is TagBulkAction {
    return this.bulkActions.has(action as TagBulkAction);
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
        const m = key.match(/^filter\[(.+)\]$/);
        if (m && value) filters[m[1]] = value;
      }
    }
    const result = await this.tagsService.list({
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
    const options = await this.tagsService.getOptions(
      column ?? 'name',
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
    const row = await this.tagsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse('Không tìm thấy thẻ', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { name?: string; slug?: string },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    if (!body?.name?.trim() || !body?.slug?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'name và slug là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.tagsService.create({
      name: body.name.trim(),
      slug: body.slug.trim(),
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo thẻ',
        `Tạo thẻ: ${created.name} (${created.slug})`,
        `${ADMIN_ROUTES.TAGS}/${created.id}`,
        {
          resource: RESOURCES.TAGS,
          action: ACTIONS.CREATE,
          resourceId: created.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.tagsService.update(id, {
      name: body?.name?.trim(),
      slug: body?.slug?.trim(),
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy thẻ',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật thẻ',
        `Cập nhật thẻ: ${updated.name} (${updated.slug})`,
        `${ADMIN_ROUTES.TAGS}/${updated.id}`,
        {
          resource: RESOURCES.TAGS,
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
    const result = await this.tagsService.bulk(action, ids);
    if (userId && result.affected > 0) {
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
        `Đã ${actionLabel} ${result.affected} thẻ`,
        `Bulk: ${actionLabel} ${result.affected} thẻ`,
        ADMIN_ROUTES.TAGS,
        {
          resource: RESOURCES.TAGS,
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
    const ok = await this.tagsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse('Không tìm thấy thẻ', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn thẻ',
        `Xóa vĩnh viễn thẻ id: ${id}`,
        ADMIN_ROUTES.TAGS,
        {
          resource: RESOURCES.TAGS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn thẻ',
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
    const ok = await this.tagsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Thẻ không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa thẻ',
        `Xóa thẻ (soft) id: ${id}`,
        ADMIN_ROUTES.TAGS,
        {
          resource: RESOURCES.TAGS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa thẻ',
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
    const ok = await this.tagsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Thẻ không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục thẻ',
        `Khôi phục thẻ id: ${id}`,
        `${ADMIN_ROUTES.TAGS}/${id}`,
        {
          resource: RESOURCES.TAGS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục thẻ',
    });
    return res.status(statusCode).json(body);
  }
}
