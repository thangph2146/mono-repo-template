import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UploadsService } from './uploads.service';
import { PUBLIC_ROUTES } from '../config/constants';

@Controller(PUBLIC_ROUTES.SERVE_UPLOADS)
export class PublicUploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('*path')
  async serve(
    @Param('path') relativePath: string | string[],
    @Res() res: Response,
  ) {
    const pathStr = Array.isArray(relativePath)
      ? relativePath.join('/')
      : (relativePath ?? '');
    if (!pathStr) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const pathNorm = pathStr.replace(/\\/g, '/');
    try {
      const { stream, contentType } =
        await this.uploadsService.serveFile(pathNorm);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      stream.pipe(res);
    } catch {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
  }
}
