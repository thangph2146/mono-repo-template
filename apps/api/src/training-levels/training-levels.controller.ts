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
import { TrainingLevelsService } from './training-levels.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('TrainingLevels')
@Controller(ADMIN_ROUTES.TRAINING_LEVELS)
export class TrainingLevelsController {
  private readonly logger = new Logger(TrainingLevelsController.name);

  constructor(private readonly trainingLevelsService: TrainingLevelsService) {}

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

  @Get()
  @ApiOperation({ summary: 'List training levels with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('statusFilter') statusFilter?: string,
    @Query('updatedAtFrom') updatedAtFrom?: string,
    @Query('updatedAtTo') updatedAtTo?: string,
    @Query('deletedAtFrom') deletedAtFrom?: string,
    @Query('deletedAtTo') deletedAtTo?: string,
  ) {
    this.logger.log(`list page=${page ?? 1} limit=${limit ?? 10}`);
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const result = await this.trainingLevelsService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: (status as 'active' | 'deleted' | 'all') ?? 'active',
      statusFilter: statusFilter != null ? Number(statusFilter) : undefined,
      updatedAtFrom: updatedAtFrom?.trim(),
      updatedAtTo: updatedAtTo?.trim(),
      deletedAtFrom: deletedAtFrom?.trim(),
      deletedAtTo: deletedAtTo?.trim(),
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get training level by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.trainingLevelsService.getById(Number(id));
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy trình độ đào tạo',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new training level' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { name: string; code?: string; status?: number },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    if (!body?.name?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'name là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.trainingLevelsService.create({
      name: body.name.trim(),
      code: body.code?.trim() ?? null,
      status: body.status,
    });
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update training level by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; status?: number },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.trainingLevelsService.update(Number(id), {
      name: body?.name?.trim(),
      code: body?.code !== undefined ? (body.code?.trim() ?? null) : undefined,
      status: body?.status,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy trình độ đào tạo',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete training level permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.trainingLevelsService.hardDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy trình độ đào tạo',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn trình độ đào tạo',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete training level' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.trainingLevelsService.softDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Trình độ đào tạo không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa trình độ đào tạo',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted training level' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.trainingLevelsService.restore(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Trình độ đào tạo không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục trình độ đào tạo',
    });
    return res.status(statusCode).json(body);
  }
}
