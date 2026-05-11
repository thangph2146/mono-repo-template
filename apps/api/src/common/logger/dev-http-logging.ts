import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AppLogger } from './app-logger.service';

/**
 * Ghi mọi request HTTP (method, URL, status, thời gian) khi chạy local.
 * Chỉ bật với NODE_ENV=development để tránh ồn và lộ metadata ở production.
 */
export function registerDevHttpLogging(
  app: INestApplication,
  logger: AppLogger,
): void {
  if (process.env.NODE_ENV !== 'development') {
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
      logger.verbose(
        `${req.method} ${url} → ${res.statusCode} ${ms.toFixed(1)}ms`,
        'HTTP',
      );
    });
    next();
  });
}
