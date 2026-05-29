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
import { EventCheckinsService } from './event-checkins.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('Event Checkins')
@Controller(ADMIN_ROUTES.EVENT_CHECKINS)
export class EventCheckinsController {
  private readonly logger = new Logger(EventCheckinsController.name);

  constructor(private readonly eventCheckinsService: EventCheckinsService) {}

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
  @ApiOperation({ summary: 'List event checkins with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('eventId') eventId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    this.logger.log(
      `list eventId=${eventId} page=${page ?? 1} limit=${limit ?? 10}`,
    );
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    if (!eventId?.trim()) {
      const { statusCode, body } = createErrorResponse('eventId là bắt buộc', {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }
    const result = await this.eventCheckinsService.list({
      eventId: eventId.trim(),
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
      status: (status as 'active' | 'deleted' | 'all') ?? 'active',
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event checkin by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.eventCheckinsService.getById(id);
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy check-in',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new event checkin' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      eventId: string;
      email: string;
      fullName: string;
      registrationId?: string;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    if (!body?.eventId?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'eventId là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (!body?.email?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'email là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    if (!body?.fullName?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'fullName là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.eventCheckinsService.create({
      eventId: body.eventId.trim(),
      email: body.email.trim(),
      fullName: body.fullName.trim(),
      registrationId: body.registrationId?.trim() ?? null,
      checkinTime: new Date(),
    });
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event checkin by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      email?: string;
      fullName?: string;
      checkinType?: number;
      faceVerified?: boolean;
      status?: number;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.eventCheckinsService.update(id, {
      email: body?.email?.trim(),
      fullName: body?.fullName?.trim(),
      checkinType: body?.checkinType,
      faceVerified: body?.faceVerified,
      status: body?.status,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy check-in',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete event checkin permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.eventCheckinsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy check-in',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn check-in',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete event checkin' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.eventCheckinsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Check-in không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa check-in',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted event checkin' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.eventCheckinsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Check-in không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục check-in',
    });
    return res.status(statusCode).json(body);
  }
}
