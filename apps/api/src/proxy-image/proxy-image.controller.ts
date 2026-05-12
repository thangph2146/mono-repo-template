/**
 * GET /api/admin/proxy-image?url=... - Proxy ảnh từ URL ngoài (tránh CORS).
 * Chấp nhận cả /proxy-image và /proxy-image/ (trailing slash).
 */
import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ADMIN_ROUTES } from '../config/constants';

@Controller(ADMIN_ROUTES.BASE)
export class ProxyImageController {
  private readonly logger = new Logger(ProxyImageController.name);

  @Get('proxy-image')
  proxy(@Res() res: Response, @Query('url') url?: string) {
    this.logger.log(`proxy url=${url ? '[set]' : '-'}`);
    return this.handleProxy(res, url);
  }

  @Get('proxy-image/')
  proxyWithSlash(@Res() res: Response, @Query('url') url?: string) {
    return this.handleProxy(res, url);
  }

  private handleProxy(res: Response, url?: string) {
    const raw = url?.trim();
    if (!raw || (!raw.startsWith('http://') && !raw.startsWith('https://'))) {
      return res.status(400).json({ error: 'Missing or invalid url' });
    }
    return this.fetchAndStream(res, raw);
  }

  private async fetchAndStream(res: Response, raw: string) {
    try {
      const fetchRes = await fetch(raw, {
        method: 'GET',
        headers: { 'User-Agent': 'TuyenSinhApi/1.0' },
      });
      if (!fetchRes.ok) {
        return res.status(fetchRes.status === 404 ? 404 : 502).json({
          error: 'Upstream failed',
          status: fetchRes.status,
        });
      }
      const contentType = fetchRes.headers.get('content-type') ?? 'image/*';
      const blob = await fetchRes.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(blob));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(502).json({ error: 'Proxy failed', details: message });
    }
  }
}
