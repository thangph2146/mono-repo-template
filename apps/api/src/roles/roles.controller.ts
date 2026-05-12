/**
 * Roles Admin API Controller.
 * GET list, options, :id; POST (create); PUT :id; DELETE :id; POST :id/restore; DELETE :id/hard-delete; POST bulk.
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
import { RolesService } from './roles.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type RoleListStatus = 'active' | 'deleted' | 'all';
type RoleBulkAction = 'delete' | 'restore' | 'hard-delete';

@Controller(ADMIN_ROUTES.ROLES)
export class RolesController {
  private readonly logger = new Logger(RolesController.name);
  private readonly listStatuses = new Set<RoleListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<RoleBulkAction>([
    'delete',
    'restore',
    'hard-delete',
  ]);

  constructor(
    private readonly rolesService: RolesService,
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

  private unauthorized(res: Response): Response {
    const { statusCode, body } = createErrorResponse(
      `Thiếu header ${APP_HEADERS.USER_ID}`,
      { status: 401 },
    );
    return res.status(statusCode).json(body);
  }

  private parseListStatus(status?: string): RoleListStatus {
    if (status && this.listStatuses.has(status as RoleListStatus)) {
      return status as RoleListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is RoleBulkAction {
    return this.bulkActions.has(action as RoleBulkAction);
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
    const result = await this.rolesService.list({
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
    const options = await this.rolesService.getOptions(
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
    const row = await this.rolesService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy vai trò',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      name?: string;
      displayName?: string;
      description?: string | null;
      permissions?: unknown;
      isActive?: boolean;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    if (!body?.name?.trim() || !body?.displayName?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'name và displayName là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.rolesService.create({
      name: body.name.trim(),
      displayName: body.displayName.trim(),
      description: body.description ?? null,
      permissions: body.permissions,
      isActive: body.isActive ?? true,
    });
    this.socketGateway.emitRoleUpsert(created, null, 'active');
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo vai trò',
        `Tạo vai trò: ${created.displayName ?? created.name} (${created.name})`,
        `${ADMIN_ROUTES.ROLES}/${created.id}`,
        {
          resource: RESOURCES.ROLES,
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
    @Body()
    body: {
      name?: string;
      displayName?: string;
      description?: string | null;
      permissions?: unknown;
      isActive?: boolean;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.rolesService.update(id, {
      name: body?.name?.trim(),
      displayName: body?.displayName?.trim(),
      description: body?.description ?? undefined,
      permissions: body?.permissions,
      isActive: body?.isActive,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy vai trò',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật vai trò',
        `Cập nhật vai trò: ${updated.displayName ?? updated.name} (${updated.name})`,
        `${ADMIN_ROUTES.ROLES}/${updated.id}`,
        {
          resource: RESOURCES.ROLES,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
    this.socketGateway.emitRoleUpsert(
      updated,
      updated.deletedAt ? 'deleted' : 'active',
      updated.deletedAt ? 'deleted' : 'active',
    );
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
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
    const ok = await this.rolesService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Vai trò không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    this.socketGateway.emitRoleUpsert({ id }, 'active', 'deleted');
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vai trò',
        `Xóa vai trò (soft) id: ${id}`,
        ADMIN_ROUTES.ROLES,
        {
          resource: RESOURCES.ROLES,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vai trò',
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
    const result = await this.rolesService.bulk(action, ids);
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
        `Đã ${actionLabel} ${result.affected} vai trò`,
        `Bulk: ${actionLabel} ${result.affected} vai trò`,
        ADMIN_ROUTES.ROLES,
        {
          resource: RESOURCES.ROLES,
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
    const ok = await this.rolesService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Vai trò không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const restored = await this.rolesService.getById(id);
    if (restored) {
      this.socketGateway.emitRoleUpsert(restored, 'deleted', 'active');
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục vai trò',
        `Khôi phục vai trò id: ${id}`,
        `${ADMIN_ROUTES.ROLES}/${id}`,
        {
          resource: RESOURCES.ROLES,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục vai trò',
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
    const ok = await this.rolesService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy vai trò',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn vai trò',
        `Xóa vĩnh viễn vai trò id: ${id}`,
        ADMIN_ROUTES.ROLES,
        {
          resource: RESOURCES.ROLES,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn vai trò',
    });
    return res.status(statusCode).json(body);
  }
}
