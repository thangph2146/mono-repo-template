/**
 * Users Admin API Controller.
 * GET list, options, :id; POST (create); PUT :id; POST bulk; DELETE :id/hard-delete; DELETE :id; POST :id/restore.
 * Header: X-User-Id (bắt buộc). Không trả password.
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
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import { SessionsService } from '../sessions/sessions.service';
import { SocketGateway } from '../socket/socket.gateway';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

export class CreateUserDto {
  email: string;
  name: string;
  password: string;
  bio: string;
  avatar: string;
  phone: string;
  address: string;
  isActive: boolean;
  roleIds: string[];
}

export class UpdateUserDto {
  email: string;
  name: string;
  password: string;
  bio: string;
  avatar: string;
  phone: string;
  address: string;
  isActive: boolean;
  roleIds: string[];
}

export class BulkActionDto {
  action: 'delete' | 'restore' | 'hard-delete' | 'active' | 'unactive';
  ids: string[];
}

type BulkAction = 'delete' | 'restore' | 'hard-delete' | 'active' | 'unactive';

@ApiTags('Users')
@Controller(ADMIN_ROUTES.USERS)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  private readonly listStatuses = new Set(['active', 'deleted', 'all']);
  private readonly bulkActions = new Set<BulkAction>([
    'delete',
    'restore',
    'hard-delete',
    'active',
    'unactive',
  ]);

  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly sessionsService: SessionsService,
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

  private parseListStatus(input?: string): 'active' | 'deleted' | 'all' {
    if (input && this.listStatuses.has(input)) {
      return input as 'active' | 'deleted' | 'all';
    }
    return 'active';
  }

  private isBulkAction(value: string): value is BulkAction {
    return this.bulkActions.has(value as BulkAction);
  }

  /** Thu hồi mọi phiên của user và emit session:revoked(reason: account_locked). */
  private async revokeSessionsAndEmitAccountLocked(
    targetUserId: string,
  ): Promise<void> {
    const { sessionIds } =
      await this.sessionsService.revokeAllSessionsByUserId(targetUserId);
    for (const sessionId of sessionIds) {
      this.socketGateway.emitSessionRevoked(sessionId, 'account_locked');
    }
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'deleted', 'all'],
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing X-User-Id header' })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query() query?: Record<string, string>,
  ) {
    this.logger.log(
      `list page=${page ?? 1} limit=${limit ?? 10} status=${status ?? 'active'}`,
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
        if (!m) continue;
        const raw = value;
        const single = Array.isArray(raw)
          ? raw.length
            ? String(raw[0])
            : ''
          : raw != null
            ? String(raw)
            : '';
        if (single) filters[m[1]] = single;
      }
    }
    const result = await this.usersService.list({
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
  @ApiOperation({ summary: 'Get user options for dropdowns' })
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
    this.logger.log(`options column=${column ?? 'email'}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn(`options: Missing ${APP_HEADERS.USER_ID}`);
      return this.unauthorized(res);
    }
    const options = await this.usersService.getOptions(
      column ?? 'email',
      search?.trim(),
      Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
    );
    const { statusCode, body } = createSuccessResponse(options);
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
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
    const row = await this.usersService.getById(id);
    if (!row) {
      this.logger.log(`getById id=${id} not found`);
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      email?: string;
      name?: string | null;
      password?: string;
      bio?: string | null;
      avatar?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
      roleIds?: string[];
    },
  ) {
    this.logger.log('create');
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    if (!body?.email?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'email là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (!body?.password || typeof body.password !== 'string') {
      const { statusCode, body: errBody } = createErrorResponse(
        'password là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.usersService.create({
      email: body.email.trim(),
      name: body.name?.trim() ?? null,
      password: body.password,
      bio: body.bio ?? null,
      avatar: body.avatar ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      isActive: body.isActive ?? true,
      roleIds: body.roleIds,
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo người dùng',
        `Tạo người dùng: ${created.email}${created.name ? ` (${created.name})` : ''}`,
        `${ADMIN_ROUTES.USERS}/${created.id}`,
        {
          resource: RESOURCES.USERS,
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
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      email?: string;
      name?: string | null;
      password?: string;
      bio?: string | null;
      avatar?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
      roleIds?: string[];
    },
  ) {
    this.logger.log(`update id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.usersService.update(id, {
      email: body?.email?.trim(),
      name: body?.name?.trim(),
      password: body?.password,
      bio: body?.bio,
      avatar: body?.avatar,
      phone: body?.phone?.trim(),
      address: body?.address?.trim(),
      isActive: body?.isActive,
      roleIds: body?.roleIds,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (body?.isActive === false) {
      await this.revokeSessionsAndEmitAccountLocked(updated.id);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật người dùng',
        `Cập nhật người dùng: ${updated.email}${updated.name ? ` (${updated.name})` : ''}`,
        `${ADMIN_ROUTES.USERS}/${updated.id}`,
        {
          resource: RESOURCES.USERS,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk action on users' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ type: BulkActionDto })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { action?: string; ids?: string[] },
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
    const result = await this.usersService.bulk(action, ids);
    if (action === 'unactive' && result.affectedUserIds?.length) {
      for (const targetUserId of result.affectedUserIds) {
        await this.revokeSessionsAndEmitAccountLocked(targetUserId);
      }
    }
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
        case 'active':
          actionLabel = 'Kích hoạt';
          actionType = ACTIONS.ACTIVE;
          break;
        case 'unactive':
          actionLabel = 'Hủy kích hoạt';
          actionType = ACTIONS.UNACTIVE;
          break;
      }

      this.logActivity(
        userId,
        `Đã ${actionLabel} ${result.affected} người dùng`,
        `Bulk: ${actionLabel} ${result.affected} người dùng`,
        ADMIN_ROUTES.USERS,
        {
          resource: RESOURCES.USERS,
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
  @ApiOperation({ summary: 'Hard delete user permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User deleted permanently' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`hardDelete id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }
    const ok = await this.usersService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn người dùng',
        `Xóa vĩnh viễn người dùng id: ${id}`,
        ADMIN_ROUTES.USERS,
        {
          resource: RESOURCES.USERS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn người dùng',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({
    status: 404,
    description: 'User not found or already deleted',
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
    const ok = await this.usersService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Người dùng không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa người dùng',
        `Xóa người dùng (soft) id: ${id}`,
        ADMIN_ROUTES.USERS,
        {
          resource: RESOURCES.USERS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa người dùng',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User restored' })
  @ApiResponse({ status: 404, description: 'User not found or not deleted' })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`restore id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res, 'X-User-Id');
    }
    const ok = await this.usersService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Người dùng không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục người dùng',
        `Khôi phục người dùng id: ${id}`,
        `${ADMIN_ROUTES.USERS}/${id}`,
        {
          resource: RESOURCES.USERS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục người dùng',
    });
    return res.status(statusCode).json(body);
  }
}
