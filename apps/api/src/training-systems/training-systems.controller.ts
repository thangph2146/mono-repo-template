import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiResponse,
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
} from '@nestjs/common';
import type { Response } from 'express';
import { TrainingSystemsService } from './training-systems.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('TrainingSystems')
@Controller(ADMIN_ROUTES.TRAINING_SYSTEMS)
export class TrainingSystemsController {
  constructor(private readonly service: TrainingSystemsService) {}

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
  @ApiOperation({ summary: 'List training systems with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'deleted', 'all'],
  })
  @ApiResponse({ status: 200, description: 'Training systems retrieved' })
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
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const result = await this.service.list({
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
  @ApiOperation({ summary: 'Get training system by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Training system found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.service.getById(Number(id));
    if (!row) {
      const { statusCode, body } = createErrorResponse('Không tìm thấy', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create training system' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ description: 'Training system data', required: true })
  @ApiResponse({ status: 201, description: 'Created' })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { name?: string; code?: string },
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
    const created = await this.service.create({
      name: body.name.trim(),
      code: body.code?.trim() || null,
    });
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update training system' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ description: 'Updated data' })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; status?: number },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.service.update(Number(id), {
      name: body?.name?.trim(),
      code: body?.code !== undefined ? (body.code?.trim() ?? null) : undefined,
      status: body?.status,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete training system' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found or already deleted' })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.softDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy hoặc đã xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted training system' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Restored' })
  @ApiResponse({ status: 404, description: 'Not found or not deleted' })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.restore(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy hoặc chưa xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Permanently delete training system' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Hard deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.hardDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse('Không tìm thấy', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn',
    });
    return res.status(statusCode).json(body);
  }
}
