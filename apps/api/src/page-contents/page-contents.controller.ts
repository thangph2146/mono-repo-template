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
import { PageContentsService } from './page-contents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import { AuthService } from '../auth/auth.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS, PERMISSIONS } from '../config/permissions';
import type {
  PageContentCreateInput,
  PageContentUpdateInput,
} from './page-contents.service';

@Controller(ADMIN_ROUTES.PAGE_CONTENTS)
export class PageContentsController {
  private readonly logger = new Logger(PageContentsController.name);

  constructor(
    private readonly pageContentsService: PageContentsService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
  ) {}

  private async checkPermission(
    userId: string | null,
    permission: string,
  ): Promise<boolean> {
    if (!userId) return false;
    const payload = await this.authService.getAuthPayloadByUserId(userId);
    if (!payload) return false;

    // Check if user has the specific permission or is a super admin
    return (
      payload.permissions.includes(permission) ||
      payload.roles.some((r) => r.name === 'super_admin')
    );
  }

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

  private logApiError(api: string, error: unknown, metadata?: unknown): void {
    const details =
      error instanceof Error
        ? {
            api,
            name: error.name,
            message: error.message,
            stack: error.stack ?? null,
            metadata: metadata ?? null,
          }
        : {
            api,
            message: String(error),
            stack: null,
            metadata: metadata ?? null,
          };
    this.logger.error(JSON.stringify(details));
  }

  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const hasPermission = await this.checkPermission(
      userId,
      PERMISSIONS.PAGE_CONTENTS_VIEW,
    );
    if (!hasPermission) {
      const { statusCode, body } = createErrorResponse(
        'Bạn không có quyền xem nội dung trang',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result = await this.pageContentsService.list({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search,
      });
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logApiError('GET /api/admin/page-contents', error, {
        userId,
        page,
        limit,
        search,
      });
      const { statusCode, body } = createErrorResponse(
        `Internal Server Error: ${errorMessage}`,
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
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

    const hasPermission = await this.checkPermission(
      userId,
      PERMISSIONS.PAGE_CONTENTS_VIEW,
    );
    if (!hasPermission) {
      const { statusCode, body } = createErrorResponse(
        'Bạn không có quyền xem nội dung trang',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result = await this.pageContentsService.getById(id);
      if (!result) {
        const { statusCode, body } = createErrorResponse(
          'Page content not found',
          {
            status: 404,
          },
        );
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/admin/page-contents/:id', error, {
        userId,
        id,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post()
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() data: PageContentCreateInput,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const hasPermission = await this.checkPermission(
      userId,
      PERMISSIONS.PAGE_CONTENTS_CREATE,
    );
    if (!hasPermission) {
      const { statusCode, body } = createErrorResponse(
        'Bạn không có quyền tạo nội dung trang',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result = await this.pageContentsService.create(data);

      if (userId) {
        this.logActivity(
          userId,
          'Đã tạo nội dung trang',
          `Tạo nội dung trang: ${result.pageKey} - ${result.sectionKey}`,
          ADMIN_ROUTES.PAGE_CONTENTS,
          {
            resource: RESOURCES.PAGE_CONTENTS,
            action: ACTIONS.CREATE,
            resourceId: result.id,
          },
        );
      }

      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('POST /api/admin/page-contents', error, {
        userId,
        pageKey: data.pageKey,
        sectionKey: data.sectionKey,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Put(':id')
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body() data: PageContentUpdateInput,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const hasPermission = await this.checkPermission(
      userId,
      PERMISSIONS.PAGE_CONTENTS_UPDATE,
    );
    if (!hasPermission) {
      const { statusCode, body } = createErrorResponse(
        'Bạn không có quyền cập nhật nội dung trang',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result = await this.pageContentsService.update(id, data);
      if (!result) {
        const { statusCode, body } = createErrorResponse(
          'Page content not found',
          {
            status: 404,
          },
        );
        return res.status(statusCode).json(body);
      }

      if (userId) {
        this.logActivity(
          userId,
          'Đã cập nhật nội dung trang',
          `Cập nhật nội dung trang: ${result.pageKey} - ${result.sectionKey}`,
          ADMIN_ROUTES.PAGE_CONTENTS,
          {
            resource: RESOURCES.PAGE_CONTENTS,
            action: ACTIONS.UPDATE,
            resourceId: result.id,
          },
        );
      }

      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('PUT /api/admin/page-contents/:id', error, {
        userId,
        id,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Delete(':id')
  async delete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const hasPermission = await this.checkPermission(
      userId,
      PERMISSIONS.PAGE_CONTENTS_DELETE,
    );
    if (!hasPermission) {
      const { statusCode, body } = createErrorResponse(
        'Bạn không có quyền xóa nội dung trang',
        { status: 403 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      await this.pageContentsService.delete(id);

      if (userId) {
        this.logActivity(
          userId,
          'Đã xóa nội dung trang',
          `Xóa nội dung trang id: ${id}`,
          ADMIN_ROUTES.PAGE_CONTENTS,
          {
            resource: RESOURCES.PAGE_CONTENTS,
            action: ACTIONS.DELETE,
            resourceId: id,
          },
        );
      }

      const { statusCode, body } = createSuccessResponse({ success: true });
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('DELETE /api/admin/page-contents/:id', error, {
        userId,
        id,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
  }
}
