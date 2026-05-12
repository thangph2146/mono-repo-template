import type { NextFunction, Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { APP_HEADERS } from '../config/constants';
import { REQUEST_ID_HEADER } from './request-id.middleware';

const logger = new Logger('API_ACCESS');

export function ApiAccessMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const requestId =
    (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? '-';
  const userId =
    (
      req.headers[APP_HEADERS.USER_ID.toLowerCase()] as string | undefined
    )?.trim() || '-';
  const method = req.method;
  const url = req.originalUrl ?? req.url ?? '-';
  const ip = req.ip ?? req.socket?.remoteAddress ?? '-';
  const apiTag = buildApiTag(url);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level =
      status >= 500 ? 'error' : status >= 400 ? 'warn' : ('log' as const);
    const icon = status >= 500 ? '✗' : status >= 400 ? '⚠' : '✓';

    logger[level](
      `${icon} ${apiTag} [${method}] ${url} | status=${status} | ${duration}ms | user=${userId} | req=${requestId} | ip=${ip}`,
    );
  });

  next();
}

function buildApiTag(url: string): string {
  const clean = (url || '').split('?')[0];
  const segments = clean.split('/').filter(Boolean);
  const apiIdx = segments.indexOf('api');
  if (apiIdx === -1) return '[UNKNOWN]';
  const scope = (segments[apiIdx + 1] || 'unknown').toUpperCase();
  const resource = (segments[apiIdx + 2] || 'root').toUpperCase();
  return `[${scope}/${resource}]`;
}
