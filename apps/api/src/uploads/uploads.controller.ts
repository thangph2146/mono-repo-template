/**
 * Uploads Controller - Admin API: list images/folders, upload, create folder, delete, serve file.
 * Header: X-User-Id (bắt buộc). Serve base URL có thể truyền qua query hoặc header để build URL ảnh.
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Headers,
  Res,
  Req,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';
import { UploadsService } from './uploads.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { appConfig } from '../config/app.config';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

/** Giới hạn kích thước file upload (multer); đồng bộ với appConfig.bodyLimit (50mb). */
const MAX_UPLOAD_FILE_BYTES = 50 * 1024 * 1024;

@Controller(ADMIN_ROUTES.UPLOADS)
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(private readonly uploadsService: UploadsService) {}

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

  /** GET /api/admin/uploads?page=1&limit=50 hoặc ?listFolders=true */
  @Get()
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('listFolders') listFolders?: string,
    @Req() req?: Request,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    if (listFolders === 'true') {
      const result = await this.uploadsService.listFolders();
      const { statusCode, body } = createSuccessResponse(result.data);
      return res.status(statusCode).json(body);
    }

    const serveBaseUrl = this.getServeBaseUrl(req);
    const result = await this.uploadsService.listImages({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
      serveBaseUrl,
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      folderTree: result.folderTree,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  /** POST /api/admin/uploads - FormData: action=createFolder + folderName + parentPath? hoặc file + folderPath? + isExistingFolder? */
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_FILE_BYTES } }),
  )
  async post(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Req() req: Request,
    @UploadedFile()
    file?: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const formData = req.body as Record<string, string>;
    const action = formData?.action;

    if (action === 'createFolder') {
      const folderName = formData?.folderName;
      const parentPath = formData?.parentPath || null;
      const resourceType =
        formData?.resourceType === 'files' ? 'files' : 'images';
      if (!folderName?.trim()) {
        const { statusCode, body } = createErrorResponse('Thiếu folderName', {
          status: 400,
        });
        return res.status(statusCode).json(body);
      }
      const data = await this.uploadsService.createFolder(
        folderName.trim(),
        parentPath || undefined,
        resourceType,
      );
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    }

    if (!file?.buffer) {
      const { statusCode, body } = createErrorResponse(
        'Thiếu file hoặc action createFolder',
        { status: 400 },
      );
      return res.status(statusCode).json(body);
    }

    const folderPath = formData?.folderPath;
    const isExistingFolder = formData?.isExistingFolder === 'true';
    const serveBaseUrl = this.getServeBaseUrl(req);

    try {
      const data = await this.uploadsService.saveFile(
        {
          buffer: file.buffer,
          originalname: file.originalname || 'image',
          mimetype: file.mimetype || 'application/octet-stream',
        },
        folderPath || undefined,
        isExistingFolder,
        serveBaseUrl,
      );
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi upload';
      this.logApiError(`POST ${ADMIN_ROUTES.UPLOADS}`, err, {
        action,
        folderPath,
        isExistingFolder,
        fileName: file?.originalname ?? null,
      });
      const { statusCode, body } = createErrorResponse(message, {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }
  }

  /** DELETE /api/admin/uploads?path=... hoặc ?path=...&deleteFolder=true */
  @Delete()
  async delete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('path') pathParam?: string,
    @Query('deleteFolder') deleteFolder?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }

    const relativePath = pathParam?.trim();
    if (!relativePath) {
      const { statusCode, body } = createErrorResponse('Thiếu path', {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }

    try {
      if (deleteFolder === 'true') {
        await this.uploadsService.deleteFolder(relativePath);
      } else {
        await this.uploadsService.deleteFile(relativePath);
      }
      const { statusCode, body } = createSuccessResponse({ deleted: true });
      return res.status(statusCode).json(body);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi xóa';
      this.logApiError(`DELETE ${ADMIN_ROUTES.UPLOADS}`, err, {
        path: relativePath,
        deleteFolder: deleteFolder === 'true',
      });
      const { statusCode, body } = createErrorResponse(message, {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }
  }

  /** GET /api/admin/uploads/serve/* - Serve file ảnh (public để img src gọi được). path-to-regexp v8: dùng *path (có thể trả về mảng) */
  @Get('serve/*path')
  async serve(
    @Param('path') relativePath: string | string[],
    @Res() res: Response,
  ) {
    const pathStr = Array.isArray(relativePath)
      ? relativePath.join('/')
      : (relativePath ?? '');
    if (!pathStr) {
      return res.status(400).json({ success: false, message: 'Invalid path' });
    }
    const pathNorm = pathStr.replace(/\\/g, '/');
    try {
      const { stream, contentType } =
        await this.uploadsService.serveFile(pathNorm);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      stream.pipe(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Not found';
      this.logApiError(`GET ${ADMIN_ROUTES.UPLOADS}/serve/*path`, err, {
        path: pathNorm,
      });
      return res.status(404).json({ success: false, message });
    }
  }

  private getServeBaseUrl(req?: Request): string {
    if (appConfig.publicUrl) {
      return `${appConfig.publicUrl.replace(/\/$/, '')}/api/admin/uploads/serve`;
    }
    if (appConfig.nodeEnv === 'production') {
      return '';
    }
    const fallback = req && `${req.protocol || 'http'}://${req.get('host')}`;
    return fallback
      ? `${fallback.replace(/\/$/, '')}/api/admin/uploads/serve`
      : '';
  }
}
