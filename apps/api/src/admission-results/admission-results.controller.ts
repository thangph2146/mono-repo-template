/**
 * Admission Results Admin API Controller.
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
import { AdmissionResultsService } from './admission-results.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type AdmissionListStatus = 'active' | 'deleted' | 'all';
type AdmissionBulkAction = 'delete' | 'restore' | 'hard-delete';

@Controller(ADMIN_ROUTES.ADMISSION_RESULTS)
export class AdmissionResultsController {
  private readonly logger = new Logger(AdmissionResultsController.name);
  private readonly listStatuses = new Set<AdmissionListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<AdmissionBulkAction>([
    'delete',
    'restore',
    'hard-delete',
  ]);

  constructor(
    private readonly admissionResultsService: AdmissionResultsService,
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

  private parseListStatus(status?: string): AdmissionListStatus {
    if (status && this.listStatuses.has(status as AdmissionListStatus)) {
      return status as AdmissionListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is AdmissionBulkAction {
    return this.bulkActions.has(action as AdmissionBulkAction);
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
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
        if (m && value && m[1]) filters[m[1]] = value;
      }
    }
    const result = await this.admissionResultsService.list({
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
    const options = await this.admissionResultsService.getOptions(
      column ?? 'hoTen',
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
    const row = await this.admissionResultsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy kết quả',
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
    body: Record<string, unknown>,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const hoTen = typeof body?.hoTen === 'string' ? body.hoTen.trim() : '';
    const nganhDangKy =
      typeof body?.nganhDangKy === 'string' ? body.nganhDangKy.trim() : '';
    if (!hoTen || !nganhDangKy) {
      const { statusCode, body: errBody } = createErrorResponse(
        'hoTen và nganhDangKy là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.admissionResultsService.create({
      cccd: typeof body.cccd === 'string' ? body.cccd : undefined,
      soBaoDanh:
        typeof body.soBaoDanh === 'string' ? body.soBaoDanh : undefined,
      hoTen,
      nganhDangKy,
      diemMon1: typeof body.diemMon1 === 'string' ? body.diemMon1 : undefined,
      diemMon2: typeof body.diemMon2 === 'string' ? body.diemMon2 : undefined,
      diemMon3: typeof body.diemMon3 === 'string' ? body.diemMon3 : undefined,
      diemTong: typeof body.diemTong === 'string' ? body.diemTong : undefined,
      diemUuTienKhuVuc:
        typeof body.diemUuTienKhuVuc === 'string'
          ? body.diemUuTienKhuVuc
          : undefined,
      diemUuTienDoiTuong:
        typeof body.diemUuTienDoiTuong === 'string'
          ? body.diemUuTienDoiTuong
          : undefined,
      ghiChu: typeof body.ghiChu === 'string' ? body.ghiChu : undefined,
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo kết quả tuyển sinh',
        `Tạo kết quả: ${created.hoTen}${created.soBaoDanh ? ` (${created.soBaoDanh})` : ''}`,
        `${ADMIN_ROUTES.ADMISSION_RESULTS}/${created.id}`,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
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
    @Body() body: Record<string, unknown>,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const updated = await this.admissionResultsService.update(id, {
      cccd: this.asOptionalString(body?.cccd),
      soBaoDanh: this.asOptionalString(body?.soBaoDanh),
      hoTen: typeof body?.hoTen === 'string' ? body.hoTen : undefined,
      nganhDangKy:
        typeof body?.nganhDangKy === 'string' ? body.nganhDangKy : undefined,
      diemMon1: this.asOptionalString(body?.diemMon1),
      diemMon2: this.asOptionalString(body?.diemMon2),
      diemMon3: this.asOptionalString(body?.diemMon3),
      diemTong: this.asOptionalString(body?.diemTong),
      diemUuTienKhuVuc: this.asOptionalString(body?.diemUuTienKhuVuc),
      diemUuTienDoiTuong: this.asOptionalString(body?.diemUuTienDoiTuong),
      ghiChu: this.asOptionalString(body?.ghiChu),
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy kết quả',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã cập nhật kết quả tuyển sinh',
        `Cập nhật kết quả: ${updated.hoTen}${updated.soBaoDanh ? ` (${updated.soBaoDanh})` : ''}`,
        `${ADMIN_ROUTES.ADMISSION_RESULTS}/${updated.id}`,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
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
    const ok = await this.admissionResultsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Kết quả không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa kết quả tuyển sinh',
        `Xóa kết quả (soft) id: ${id}`,
        ADMIN_ROUTES.ADMISSION_RESULTS,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa kết quả',
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
    const result = await this.admissionResultsService.bulk(action, ids);
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
        `Đã ${actionLabel} ${result.affected} kết quả tuyển sinh`,
        `Bulk: ${actionLabel} ${result.affected} kết quả`,
        ADMIN_ROUTES.ADMISSION_RESULTS,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
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
    const ok = await this.admissionResultsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Kết quả không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục kết quả tuyển sinh',
        `Khôi phục kết quả id: ${id}`,
        `${ADMIN_ROUTES.ADMISSION_RESULTS}/${id}`,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục kết quả',
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
    const ok = await this.admissionResultsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy kết quả',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn kết quả tuyển sinh',
        `Xóa vĩnh viễn kết quả id: ${id}`,
        ADMIN_ROUTES.ADMISSION_RESULTS,
        {
          resource: RESOURCES.ADMISSION_RESULTS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn kết quả',
    });
    return res.status(statusCode).json(body);
  }
}
