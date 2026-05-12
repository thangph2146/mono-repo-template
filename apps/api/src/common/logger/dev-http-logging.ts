import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AppLogger } from './app-logger.service';

function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

function safeBodyPreview(body: unknown, max = 2000): string | undefined {
  if (body == null) return undefined;
  if (typeof body !== 'object') return undefined;
  try {
    const s = JSON.stringify(body);
    if (s === '{}') return undefined;
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return '[body không serialize được]';
  }
}

/**
 * Ghi request HTTP: method, URL đầy đủ (kèm prefix /api), status, thời gian,
 * optional `x-user-id`, và khi lỗi 4xx/5xx thì log thêm body (POST/PUT/PATCH).
 *
 * Bật khi **không** phải production (`NODE_ENV !== 'production'`), vì `nest start`
 * thường không set NODE_ENV=development.
 */
export function registerDevHttpLogging(
  app: INestApplication,
  logger: AppLogger,
): void {
  if (isProductionNodeEnv()) {
    return;
  }

  const expressApp = app.getHttpAdapter().getInstance() as {
    use: (
      fn: (req: Request, res: Response, next: NextFunction) => void,
    ) => void;
  };

  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const url = req.originalUrl ?? req.url;
      const userId = req.get('x-user-id');
      const userPart = userId ? ` x-user-id=${userId}` : '';
      const line = `${req.method} ${url} → ${res.statusCode} ${ms.toFixed(1)}ms${userPart}`;
      logger.log(line, 'HTTP');
      if (
        res.statusCode >= 400 &&
        ['POST', 'PUT', 'PATCH'].includes(req.method)
      ) {
        const preview = safeBodyPreview(req.body, 2000);
        if (preview) {
          logger.log(`  ↳ body: ${preview}`, 'HTTP');
        }
      }
    });
    next();
  });
}
