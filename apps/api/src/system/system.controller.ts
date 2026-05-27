import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Res,
  Logger,
  Query,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { SystemService } from './system.service';
import { AuthService } from '../auth/auth.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import {
  APP_HEADERS,
  ADMIN_ROUTES,
  AUTH_ROLE_NAMES,
} from '../config/constants';
import { PERMISSIONS } from '../config/permissions';

/** Khớp admin: `/system/maintenance` và API import/export dùng SETTINGS_MANAGE; API trước đây chỉ super_admin → 403 cho admin thường. */
const SYSTEM_MAINTENANCE_PERMISSIONS: ReadonlySet<string> = new Set([
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.SETTINGS_IMPORT,
]);
const MAX_SYSTEM_EXCEL_FILE_BYTES = 50 * 1024 * 1024;

/** Import/export nhiều chunk — không áp dụng giới hạn 100 req/phút toàn cục. */
@SkipThrottle()
@Controller(ADMIN_ROUTES.SYSTEM)
export class SystemController {
  private readonly logger = new Logger(SystemController.name);

  constructor(
    private readonly systemService: SystemService,
    private readonly authService: AuthService,
  ) {}

  private async canAccessSystemMaintenance(
    headers: Record<string, string | undefined>,
  ): Promise<boolean> {
    const userId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!userId) return false;

    const payload = await this.authService.getAuthPayloadByUserId(userId);
    if (!payload) return false;

    if (
      payload.roles.some((role) => role.name === AUTH_ROLE_NAMES.SUPER_ADMIN)
    ) {
      return true;
    }

    return payload.permissions.some((p) =>
      SYSTEM_MAINTENANCE_PERMISSIONS.has(p),
    );
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

  @Get('models')
  async getModels(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const data = this.systemService.getModels();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/admin/system/models', error);
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('export')
  async exportData(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('model') model?: string,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const data = await this.systemService.exportData(model);
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/admin/system/export', error, { model });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('export/excel')
  async exportExcelData(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('model') model?: string,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const buffer = await this.systemService.exportExcelData(model);
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const dateStamp = `${y}-${m}-${d}`;
      const filename = model
        ? `hub-system-${model}-${dateStamp}.xlsx`
        : `hub-system-export-${dateStamp}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );
      return res.status(200).send(buffer);
    } catch (error) {
      this.logApiError('GET /api/admin/system/export/excel', error, { model });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('import')
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      transform: false,
    }),
  )
  async importData(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('model') model?: string,
    @Query('skipClear') skipClear?: string,
    @Body() data?: Record<string, any[]>,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      if (!data || Object.keys(data).length === 0) {
        const { statusCode, body } = createErrorResponse(
          'Invalid data: No data provided',
          { status: 400 },
        );
        return res.status(statusCode).json(body);
      }

      const result = await this.systemService.importData(
        data,
        model,
        skipClear === 'true',
      );
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('POST /api/admin/system/import', error, {
        model,
        skipClear,
        modelCount: data ? Object.keys(data).length : 0,
      });
      const { statusCode, body } = createErrorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('import/excel')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SYSTEM_EXCEL_FILE_BYTES },
    }),
  )
  async importExcelData(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('model') model?: string,
    @Query('skipClear') skipClear?: string,
    @UploadedFile()
    file?: { buffer: Buffer; originalname?: string; mimetype?: string },
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      if (!file?.buffer || file.buffer.length === 0) {
        const { statusCode, body } = createErrorResponse(
          'Invalid file: No Excel file uploaded',
          { status: 400 },
        );
        return res.status(statusCode).json(body);
      }

      const result = await this.systemService.importExcelData(
        file.buffer,
        model,
        skipClear === 'true',
      );
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('POST /api/admin/system/import/excel', error, {
        model,
        skipClear,
        filename: file?.originalname ?? null,
      });
      const { statusCode, body } = createErrorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  /** Khởi tạo roles + user mặc định + user_roles (+ page_contents nếu có file JSON trên server) — giống `pnpm run seed:superadmin`. */
  @Post('seed-bootstrap')
  async seedBootstrap(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const data = await this.systemService.runSuperadminBootstrapSeed();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('POST /api/admin/system/seed-bootstrap', error);
      const { statusCode, body } = createErrorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('database-schema')
  async getDatabaseSchema(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    try {
      if (!(await this.canAccessSystemMaintenance(headers))) {
        const { statusCode, body } = createErrorResponse(
          'Unauthorized: Super Admin or settings manage permission required',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const data = this.systemService.getDatabaseSchema();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/admin/system/database-schema', error);
      const { statusCode, body } = createErrorResponse(
        error instanceof Error ? error.message : 'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }
}
