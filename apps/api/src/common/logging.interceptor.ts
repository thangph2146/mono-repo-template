import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { appConfig } from '../config/app.config';
import { APP_HEADERS } from '../config/constants';
import { REQUEST_ID_HEADER } from './request-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private readonly bodyMaxLen = appConfig.logging.httpLogBodyMaxLen;
  private readonly errorMaxLen = appConfig.logging.httpLogErrorMaxLen;
  private readonly responseMaxLen = appConfig.logging.httpLogResponseMaxLen;
  private readonly logSuccessBody = appConfig.logging.httpLogSuccessBody;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const method = req.method;
    const url = req.url ?? req.originalUrl ?? '';
    const ip = req.ip ?? req.socket?.remoteAddress ?? '';
    const query = req.query as Record<string, unknown>;
    const body: unknown = req.body;
    const start = Date.now();
    const ts = new Date().toISOString();
    const userId =
      (req.headers[APP_HEADERS.USER_ID.toLowerCase()] as string)?.trim() || '-';
    const contentType = (req.headers['content-type'] as string) || '-';
    const requestId = (req.headers[REQUEST_ID_HEADER] as string) || '-';
    const controllerName = context.getClass().name || '-';
    const handlerName = context.getHandler().name || '-';
    const endpoint = `${controllerName}.${handlerName}`;
    const queryStr = Object.keys(query).length ? JSON.stringify(query) : '-';
    const bodyStr =
      this.bodyMaxLen === 0
        ? this.safeStringify(
            this.sanitizePayload(body),
            Number.MAX_SAFE_INTEGER,
          )
        : this.safeStringify(this.sanitizePayload(body), this.bodyMaxLen);
    const apiTag = this.buildApiTag(url);
    this.logger.log(
      `\n┌── REQUEST ${apiTag} ── ${ts} ── req:${requestId}\n` +
        `│  ${method} ${url}\n` +
        `│  endpoint     ${endpoint}\n` +
        `│  ip           ${ip}\n` +
        `│  ${APP_HEADERS.USER_ID}    ${userId}\n` +
        `│  req-id       ${requestId}\n` +
        `│  content-type ${contentType}\n` +
        `│  query        ${queryStr}\n` +
        `│  body         ${bodyStr}\n` +
        `└─────────────`,
    );

    const originalJson = res.json.bind(res) as (body: unknown) => Response;
    res.json = (responseBody: unknown) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      const duration = Date.now() - start;
      const summary = this.summaryBody(responseBody);
      const status = res.statusCode;
      const statusIcon = status >= 500 ? '✗' : status >= 400 ? '⚠' : '✓';
      const sanitizedResponse = this.sanitizePayload(responseBody);
      const responseSize = this.getResponseSize(sanitizedResponse);
      const payloadPreview = this.safeStringify(
        sanitizedResponse,
        this.responseMaxLen,
      );
      const bodyLines =
        this.logSuccessBody &&
        sanitizedResponse !== undefined &&
        sanitizedResponse !== null
          ? ['│  response:', ...this.formatBodyLines(sanitizedResponse, this.responseMaxLen)]
          : [];
      this.logger.log(
        `\n┌── RESPONSE ${statusIcon} ${status} ${apiTag} ── ${duration}ms ── size:${responseSize} ── req:${requestId}\n` +
          `│  ${method} ${url}\n` +
          `│  endpoint   ${endpoint}\n` +
          `│  ${APP_HEADERS.USER_ID}   ${userId}\n` +
          `│  req-id     ${requestId}\n` +
          `│  summary    ${summary}\n` +
          `│  preview    ${payloadPreview}\n` +
          (!this.logSuccessBody
            ? `│  response   [hidden for success logs, set HTTP_LOG_SUCCESS_BODY=true to show]\n`
            : '') +
          (bodyLines.length > 0 ? bodyLines.join('\n') + '\n' : '') +
          `└─────────────`,
      );
      (res as unknown as { _jsonLogged?: boolean })._jsonLogged = true;
      return originalJson(responseBody);
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const resAny = res as unknown as { _jsonLogged?: boolean };
          if (!resAny._jsonLogged) {
            const duration = Date.now() - start;
            this.logger.log(
              `\n┌── RESPONSE ✓ ${res.statusCode} ${apiTag} ── ${duration}ms ── req:${requestId}\n` +
                `│  ${method} ${url}\n` +
                `│  endpoint  ${endpoint}\n` +
                `│  ${APP_HEADERS.USER_ID}  ${userId}\n` +
                `│  req-id    ${requestId}\n` +
                `└─────────────`,
            );
          }
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          const errorDetail = this.buildErrorDetail(err);
          const queryDebug =
            this.bodyMaxLen === 0
              ? this.safeStringify(
                  this.sanitizePayload(query),
                  Number.MAX_SAFE_INTEGER,
                )
              : this.safeStringify(
                  this.sanitizePayload(query),
                  this.bodyMaxLen,
                );
          const bodyDebug =
            this.bodyMaxLen === 0
              ? this.safeStringify(
                  this.sanitizePayload(body),
                  Number.MAX_SAFE_INTEGER,
                )
              : this.safeStringify(this.sanitizePayload(body), this.bodyMaxLen);
          this.logger.error(
            `\n┌── RESPONSE ✗ ERROR ${apiTag} ── ${duration}ms ── req:${requestId}\n` +
              `│  ${method} ${url}\n` +
              `│  endpoint  ${endpoint}\n` +
              `│  ${APP_HEADERS.USER_ID}  ${userId}\n` +
              `│  req-id    ${requestId}\n` +
              `│  query     ${queryDebug}\n` +
              `│  body      ${bodyDebug}\n` +
              `│  error     ${errorDetail.summary}\n` +
              `│  details:\n` +
              this.formatBodyLines(this.sanitizePayload(errorDetail.details))
                .map((line) => `${line}\n`)
                .join('') +
              `└─────────────`,
          );
        },
      }),
    );
  }

  private buildErrorDetail(err: unknown): {
    summary: string;
    details: Record<string, unknown>;
  } {
    if (!(err instanceof Error)) {
      return {
        summary: this.safeStringify(err, 200),
        details: { raw: this.safeStringify(err, this.errorMaxLen) },
      };
    }

    const asAny = err as any;
    const stack =
      typeof err.stack === 'string'
        ? err.stack.split('\n').slice(0, 20).join('\n')
        : undefined;
    const details: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      code: asAny.code,
      status: asAny.status ?? asAny.statusCode,
      sqlState: asAny.sqlState,
      sqlMessage: asAny.sqlMessage,
      sql: asAny.sql,
      response: asAny.response,
      cause: asAny.cause,
      stack,
    };

    return {
      summary: `${err.name}: ${err.message}`,
      details,
    };
  }

  private buildApiTag(url: string): string {
    const clean = (url || '').split('?')[0];
    const segments = clean.split('/').filter(Boolean);
    const apiIdx = segments.indexOf('api');
    if (apiIdx === -1) return '[UNKNOWN]';
    const scope = (segments[apiIdx + 1] || 'unknown').toUpperCase();
    const resource = (segments[apiIdx + 2] || 'root').toUpperCase();
    return `[${scope}/${resource}]`;
  }

  private sanitizePayload(value: unknown): unknown {
    const sensitiveKeys = new Set([
      'password',
      'accessToken',
      'refreshToken',
      'token',
      'authorization',
      'cookie',
    ]);
    const visited = new WeakSet<object>();

    const walk = (input: unknown): unknown => {
      if (input === null || input === undefined) return input;
      if (typeof input !== 'object') return input;
      if (visited.has(input)) return '[circular]';
      visited.add(input);

      if (Array.isArray(input)) return input.map(walk);

      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        input as Record<string, unknown>,
      )) {
        if (sensitiveKeys.has(key) || sensitiveKeys.has(key.toLowerCase())) {
          out[key] = '[REDACTED]';
          continue;
        }
        out[key] = walk(val);
      }
      return out;
    };

    return walk(value);
  }

  private summaryBody(value: unknown): string {
    if (value === undefined || value === null) return '-';
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    )
      return String(value);
    if (typeof value === 'object') {
      const o = value as Record<string, unknown>;
      const success = o.success;
      const data = o.data;
      const msg = o.message;
      const errVal = o.error;
      const parts: string[] = [];
      if (typeof success === 'boolean') parts.push(`success: ${success}`);
      if (msg != null)
        parts.push(
          `message: "${this.safeStringify(msg, 50).replace(/"/g, '')}"`,
        );
      if (errVal != null && o.success === false)
        parts.push(`error: ${this.safeStringify(errVal, 80)}`);
      if (data != null) {
        if (Array.isArray(data)) {
          parts.push(`data: ${data.length} item(s)`);
        } else if (
          typeof data === 'object' &&
          data !== null &&
          'data' in data
        ) {
          const inner = (data as { data?: unknown }).data;
          if (Array.isArray(inner)) {
            parts.push(`data.data: ${inner.length} item(s)`);
          } else {
            parts.push(`data: ${Object.keys(data as object).join(', ')}`);
          }
        } else {
          parts.push(`data: ${Object.keys(data as object).join(', ')}`);
        }
      }
      return parts.length ? parts.join(' | ') : this.safeStringify(value, 100);
    }
    return this.safeStringify(value, 100);
  }

  private safeStringify(value: unknown, maxLen = 200): string {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'object') {
      try {
        const str = JSON.stringify(value);
        return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
      } catch {
        return '[object]';
      }
    }
    // Primitive only at this point (object handled above)
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- value narrowed to primitive
    return typeof value === 'symbol' ? value.toString() : String(value);
  }

  private getResponseSize(value: unknown): number {
    if (value === undefined || value === null) return 0;
    try {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      return 0;
    }
  }

  private formatBodyLines(value: unknown, maxLen = this.errorMaxLen): string[] {
    if (value === undefined || value === null) return [];
    try {
      const raw =
        typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2)
          : typeof value === 'symbol'
            ? value.toString()
            : // eslint-disable-next-line @typescript-eslint/no-base-to-string -- primitive after object/symbol check
              String(value);
      const str =
        maxLen > 0 && raw.length > maxLen ? `${raw.slice(0, maxLen)}...` : raw;
      const lines = str.split('\n');
      return lines.map((line) => `│  ${line}`);
    } catch {
      return [`│  ${this.safeStringify(value, this.errorMaxLen)}`];
    }
  }
}
