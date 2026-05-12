/**
 * Students Admin API Controller.
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
import { StudentsService } from './students.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type StudentListStatus = 'active' | 'deleted' | 'all';
type StudentBulkAction = 'delete' | 'restore' | 'hard-delete';

@Controller(ADMIN_ROUTES.STUDENTS)
export class StudentsController {
  private readonly logger = new Logger(StudentsController.name);
  private readonly listStatuses = new Set<StudentListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<StudentBulkAction>([
    'delete',
    'restore',
    'hard-delete',
  ]);

  constructor(
    private readonly studentsService: StudentsService,
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

  private parseListStatus(status?: string): StudentListStatus {
    if (status && this.listStatuses.has(status as StudentListStatus)) {
      return status as StudentListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is StudentBulkAction {
    return this.bulkActions.has(action as StudentBulkAction);
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
    const result = await this.studentsService.list({
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
    const options = await this.studentsService.getOptions(
      column ?? 'studentCode',
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
    const row = await this.studentsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy học viên',
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
      userId?: string | null;
      name?: string | null;
      email?: string | null;
      studentCode?: string;
      isActive?: boolean;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    if (!body?.studentCode?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'studentCode là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.studentsService.create({
      userId: body.userId ?? null,
      name: body.name?.trim() ?? null,
      email: body.email?.trim() ?? null,
      studentCode: body.studentCode.trim(),
      isActive: body.isActive ?? true,
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo học viên',
        `Tạo học viên: ${created.studentCode}${created.name ? ` (${created.name})` : ''}`,
        `${ADMIN_ROUTES.STUDENTS}/${created.id}`,
        {
          resource: RESOURCES.STUDENTS,
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
      userId?: string | null;
      name?: string | null;
      email?: string | null;
      studentCode?: string;
      isActive?: boolean;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.studentsService.update(id, {
      userId: body?.userId,
      name: body?.name?.trim(),
      email: body?.email?.trim(),
      studentCode: body?.studentCode?.trim(),
      isActive: body?.isActive,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy học viên',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật học viên',
        `Cập nhật học viên: ${updated.studentCode}${updated.name ? ` (${updated.name})` : ''}`,
        `${ADMIN_ROUTES.STUDENTS}/${updated.id}`,
        {
          resource: RESOURCES.STUDENTS,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
    }
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
    const ok = await this.studentsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Học viên không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa học viên',
        `Xóa học viên (soft) id: ${id}`,
        ADMIN_ROUTES.STUDENTS,
        {
          resource: RESOURCES.STUDENTS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa học viên',
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
    const result = await this.studentsService.bulk(action, ids);
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
        `Đã ${actionLabel} ${result.affected} học viên`,
        `Bulk: ${actionLabel} ${result.affected} học viên`,
        ADMIN_ROUTES.STUDENTS,
        {
          resource: RESOURCES.STUDENTS,
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
    const ok = await this.studentsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Học viên không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục học viên',
        `Khôi phục học viên id: ${id}`,
        `${ADMIN_ROUTES.STUDENTS}/${id}`,
        {
          resource: RESOURCES.STUDENTS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục học viên',
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
    const ok = await this.studentsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy học viên',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn học viên',
        `Xóa vĩnh viễn học viên id: ${id}`,
        ADMIN_ROUTES.STUDENTS,
        {
          resource: RESOURCES.STUDENTS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn học viên',
    });
    return res.status(statusCode).json(body);
  }
}
