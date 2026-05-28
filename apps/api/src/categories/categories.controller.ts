/**
 * Categories Admin API Controller.
 * GET list, options, :id; POST (create); PUT :id; POST bulk; DELETE :id/hard-delete; DELETE :id; POST :id/restore.
 * Header: X-User-Id (bắt buộc).
 */
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
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
import { CategoriesService } from './categories.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type CategoryListStatus = 'active' | 'deleted' | 'all';
type CategoryBulkAction = 'delete' | 'restore' | 'hard-delete' | 'set-parent';

@ApiTags('Categories')
@Controller(ADMIN_ROUTES.CATEGORIES)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);
  private readonly listStatuses = new Set<CategoryListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<CategoryBulkAction>([
    'delete',
    'restore',
    'hard-delete',
    'set-parent',
  ]);

  constructor(
    private readonly categoriesService: CategoriesService,
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

  private parseListStatus(status?: string): CategoryListStatus {
    if (status && this.listStatuses.has(status as CategoryListStatus)) {
      return status as CategoryListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is CategoryBulkAction {
    return this.bulkActions.has(action as CategoryBulkAction);
  }

  @Get()
  @ApiOperation({ summary: 'List categories with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'deleted', 'all'],
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['post', 'event'],
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing X-User-Id header' })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query() query?: Record<string, string>,
  ) {
    this.logger.log(
      `list page=${page ?? 1} limit=${limit ?? 10} status=${status ?? 'active'} type=${type ?? 'all'}`,
    );
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn(`list: Missing ${APP_HEADERS.USER_ID}`);
      return this.unauthorized(res);
    }
    const filters: Record<string, string> = {};
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        const m = key.match(/^filter\[(.+)\]$/);
        if (m && value) filters[m[1]] = value;
      }
    }
    const parsedType = type === 'post' || type === 'event' ? type : undefined;
    const result = await this.categoriesService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(1000, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: this.parseListStatus(status),
      type: parsedType,
      filters: Object.keys(filters).length ? filters : undefined,
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get category options for dropdowns' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Options retrieved successfully' })
  async options(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('column') column?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`options column=${column ?? 'name'}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn(`options: Missing ${APP_HEADERS.USER_ID}`);
      return this.unauthorized(res);
    }
    const options = await this.categoriesService.getOptions(
      column ?? 'name',
      search?.trim(),
      Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
    );
    const { statusCode, body } = createSuccessResponse(options);
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category found' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`getById id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn(`getById: Missing ${APP_HEADERS.USER_ID}`);
      return this.unauthorized(res);
    }
    const row = await this.categoriesService.getById(id);
    if (!row) {
      this.logger.log(`getById id=${id} not found`);
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy danh mục',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new category' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ description: 'Category data', required: true })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
      type?: 'post' | 'event';
    },
  ) {
    this.logger.log('create');
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
    const created = await this.categoriesService.create({
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: body.description ?? null,
      parentId:
        body.parentId === '' || body.parentId == null ? null : body.parentId,
      type:
        body.type === 'post' || body.type === 'event' ? body.type : undefined,
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo danh mục',
        `Tạo danh mục: ${created.name} (${created.slug})`,
        `${ADMIN_ROUTES.CATEGORIES}/${created.id}`,
        {
          resource: RESOURCES.CATEGORIES,
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
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ description: 'Updated category data' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
      type?: 'post' | 'event';
    },
  ) {
    this.logger.log(`update id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.categoriesService.update(id, {
      name: body?.name?.trim(),
      slug: body?.slug?.trim(),
      description: body?.description ?? undefined,
      parentId: body?.parentId === '' ? null : (body?.parentId ?? undefined),
      type:
        body.type === 'post' || body.type === 'event' ? body.type : undefined,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy danh mục',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật danh mục',
        `Cập nhật danh mục: ${updated.name} (${updated.slug})`,
        `${ADMIN_ROUTES.CATEGORIES}/${updated.id}`,
        {
          resource: RESOURCES.CATEGORIES,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk action on categories' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ description: 'Bulk action with ids' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { action?: string; ids?: string[]; parentId?: string | null },
  ) {
    this.logger.log(
      `bulk action=${body?.action} ids=${(body?.ids ?? []).length}`,
    );
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
    const result = await this.categoriesService.bulk(
      action,
      ids,
      body?.parentId,
    );
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
        case 'set-parent':
          actionLabel = 'Đổi danh mục cha';
          actionType = ACTIONS.UPDATE;
          break;
      }

      this.logActivity(
        userId,
        `Đã ${actionLabel} ${result.affected} danh mục`,
        `Bulk: ${actionLabel} ${result.affected} danh mục`,
        ADMIN_ROUTES.CATEGORIES,
        {
          resource: RESOURCES.CATEGORIES,
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
  @ApiOperation({ summary: 'Hard delete category permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category deleted permanently' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`hardDelete id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.categoriesService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy danh mục',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn danh mục',
        `Xóa vĩnh viễn danh mục id: ${id}`,
        ADMIN_ROUTES.CATEGORIES,
        {
          resource: RESOURCES.CATEGORIES,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn danh mục',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete category' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({
    status: 404,
    description: 'Category not found or already deleted',
  })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`softDelete id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.categoriesService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Danh mục không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa danh mục',
        `Xóa danh mục (soft) id: ${id}`,
        ADMIN_ROUTES.CATEGORIES,
        {
          resource: RESOURCES.CATEGORIES,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa danh mục',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted category' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Category restored' })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not deleted',
  })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`restore id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.categoriesService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Danh mục không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục danh mục',
        `Khôi phục danh mục id: ${id}`,
        `${ADMIN_ROUTES.CATEGORIES}/${id}`,
        {
          resource: RESOURCES.CATEGORIES,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục danh mục',
    });
    return res.status(statusCode).json(body);
  }
}
