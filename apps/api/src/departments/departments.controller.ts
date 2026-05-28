import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
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
import { DepartmentsService } from './departments.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('Departments')
@Controller(ADMIN_ROUTES.DEPARTMENTS)
export class DepartmentsController {
  private readonly logger = new Logger(DepartmentsController.name);
  constructor(private readonly departmentsService: DepartmentsService) {}
  private getUserId(h: Record<string, string | undefined>): string | null {
    return h[APP_HEADERS.USER_ID]?.trim() || null;
  }
  private unauthorized(r: Response): Response {
    const { statusCode, body } = createErrorResponse('Thiếu header X-User-Id', {
      status: 401,
    });
    return r.status(statusCode).json(body);
  }

  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const result = await this.departmentsService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: (status as any) ?? 'active',
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const row = await this.departmentsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy phòng khoa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create department' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    if (!body?.name?.toString().trim() || !body?.code?.toString().trim()) {
      const { statusCode, body: err } = createErrorResponse(
        'name và code là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(err);
    }
    const created = await this.departmentsService.create(body);
    const { statusCode, body: ok } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(ok);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update department' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const updated = await this.departmentsService.update(id, body);
    if (!updated) {
      const { statusCode, body: err } = createErrorResponse(
        'Không tìm thấy phòng khoa',
        { status: 404 },
      );
      return res.status(statusCode).json(err);
    }
    const { statusCode, body: ok } = createSuccessResponse(updated);
    return res.status(statusCode).json(ok);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete department' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const ok = await this.departmentsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy phòng khoa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn phòng khoa',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete department' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const ok = await this.departmentsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Phòng khoa không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa phòng khoa',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore department' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    if (!this.getUserId(headers)) return this.unauthorized(res);
    const ok = await this.departmentsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Phòng khoa không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục phòng khoa',
    });
    return res.status(statusCode).json(body);
  }
}
