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
import { SpeakersService } from './speakers.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('Speakers')
@Controller(ADMIN_ROUTES.SPEAKERS)
export class SpeakersController {
  private readonly logger = new Logger(SpeakersController.name);

  constructor(private readonly speakersService: SpeakersService) {}

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
  @ApiOperation({ summary: 'List speakers with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('speakerStatus') speakerStatus?: string,
    @Query('updatedAtFrom') updatedAtFrom?: string,
    @Query('updatedAtTo') updatedAtTo?: string,
    @Query('deletedAtFrom') deletedAtFrom?: string,
    @Query('deletedAtTo') deletedAtTo?: string,
  ) {
    this.logger.log(`list page=${page ?? 1} limit=${limit ?? 10}`);
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const result = await this.speakersService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: (status as 'active' | 'deleted' | 'all') ?? 'active',
      speakerStatus:
        speakerStatus !== undefined ? parseInt(speakerStatus, 10) : undefined,
      updatedAtFrom: updatedAtFrom?.trim() || undefined,
      updatedAtTo: updatedAtTo?.trim() || undefined,
      deletedAtFrom: deletedAtFrom?.trim() || undefined,
      deletedAtTo: deletedAtTo?.trim() || undefined,
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get speaker by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.speakersService.getById(Number(id));
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy diễn giả',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new speaker' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      name: string;
      title?: string;
      organization?: string;
      bio?: string;
      avatar?: string;
      email?: string;
      phone?: string;
      status?: number;
    },
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
    const created = await this.speakersService.create({
      name: body.name.trim(),
      title: body.title?.trim() ?? null,
      organization: body.organization?.trim() ?? null,
      bio: body.bio?.trim() ?? null,
      avatar: body.avatar?.trim() ?? null,
      email: body.email?.trim() ?? null,
      phone: body.phone?.trim() ?? null,
      status: body.status,
    });
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update speaker by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      title?: string;
      organization?: string;
      bio?: string;
      avatar?: string;
      email?: string;
      phone?: string;
      status?: number;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.speakersService.update(Number(id), {
      name: body?.name?.trim(),
      title:
        body?.title !== undefined ? (body.title?.trim() ?? null) : undefined,
      organization:
        body?.organization !== undefined
          ? (body.organization?.trim() ?? null)
          : undefined,
      bio: body?.bio !== undefined ? (body.bio?.trim() ?? null) : undefined,
      avatar:
        body?.avatar !== undefined ? (body.avatar?.trim() ?? null) : undefined,
      email:
        body?.email !== undefined ? (body.email?.trim() ?? null) : undefined,
      phone:
        body?.phone !== undefined ? (body.phone?.trim() ?? null) : undefined,
      status: body?.status,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy diễn giả',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete speaker permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.speakersService.hardDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy diễn giả',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn diễn giả',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete speaker' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.speakersService.softDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Diễn giả không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa diễn giả',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted speaker' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.speakersService.restore(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Diễn giả không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục diễn giả',
    });
    return res.status(statusCode).json(body);
  }
}
