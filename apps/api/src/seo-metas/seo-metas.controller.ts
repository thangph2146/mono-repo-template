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
import { SeoMetasService } from './seo-metas.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@Controller(ADMIN_ROUTES.SEO_METAS)
export class SeoMetasController {
  constructor(private readonly service: SeoMetasService) {}

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
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const result = await this.service.list({
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
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.service.getById(id);
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
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      page: string;
      title?: string;
      description?: string;
      keywords?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    if (!body?.page?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'page là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.service.create({
      page: body.page.trim(),
      title: body.title?.trim(),
      description: body.description?.trim(),
      keywords: body.keywords?.trim(),
      ogTitle: body.ogTitle?.trim(),
      ogDescription: body.ogDescription?.trim(),
      ogImage: body.ogImage?.trim(),
    });
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
      page?: string;
      title?: string | null;
      description?: string | null;
      keywords?: string | null;
      ogTitle?: string | null;
      ogDescription?: string | null;
      ogImage?: string | null;
      status?: number;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.service.update(id, {
      page: body?.page?.trim(),
      title: body?.title,
      description: body?.description,
      keywords: body?.keywords,
      ogTitle: body?.ogTitle,
      ogDescription: body?.ogDescription,
      ogImage: body?.ogImage,
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
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.softDelete(id);
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
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.restore(id);
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
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.service.hardDelete(id);
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
