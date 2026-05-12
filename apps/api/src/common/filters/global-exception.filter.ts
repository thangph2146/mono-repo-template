import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { AppLogger } from '../logger/app-logger.service';

function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Lấy meta driver (MySQL, …) không import MikroORM để tránh coupling. */
function pickDriverLikeMeta(err: unknown): {
  code?: string;
  errno?: number;
  sqlMessage?: string;
} {
  if (typeof err !== 'object' || err === null) return {};
  const o = err as Record<string, unknown>;
  return {
    code: typeof o.code === 'string' ? o.code : undefined,
    errno: typeof o.errno === 'number' ? o.errno : undefined,
    sqlMessage: typeof o.sqlMessage === 'string' ? o.sqlMessage : undefined,
  };
}

function httpExceptionPayload(exception: HttpException): {
  statusCode: number;
  message: string | string[];
  error?: string;
} {
  const status = exception.getStatus();
  const res = exception.getResponse();
  if (typeof res === 'string') {
    return { statusCode: status, message: res };
  }
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    const msg = r.message;
    const message = Array.isArray(msg)
      ? (msg as string[])
      : typeof msg === 'string'
        ? msg
        : exception.message;
    return {
      statusCode: typeof r.statusCode === 'number' ? r.statusCode : status,
      message,
      error: typeof r.error === 'string' ? r.error : undefined,
    };
  }
  return { statusCode: status, message: exception.message };
}

/**
 * Ghi log đầy đủ mọi lỗi HTTP + (ngoài production) trả message/sqlMeta rõ hơn
 * thay vì chỉ "Internal server error".
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const path = request.originalUrl ?? request.url;
    const method = request.method;
    const userId = request.get('x-user-id');

    if (exception instanceof HttpException) {
      const { statusCode, message, error } = httpExceptionPayload(exception);
      const meta = userId ? ` x-user-id=${userId}` : '';
      if (statusCode >= 500) {
        this.logger.error(
          `${method} ${path} → ${statusCode}${meta}`,
          exception instanceof Error ? exception.stack : undefined,
          'HTTP',
        );
      } else if (statusCode >= 400) {
        this.logger.warn(
          `${method} ${path} → ${statusCode} ${typeof message === 'string' ? message : JSON.stringify(message)}${meta}`,
          'HTTP',
        );
      }
      const body: Record<string, unknown> = {
        statusCode,
        message,
        ...(error ? { error } : {}),
        path,
      };
      response.status(statusCode).json(body);
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const err =
      exception instanceof Error ? exception : new Error(String(exception));
    const driver = pickDriverLikeMeta(exception);
    const meta = userId ? ` x-user-id=${userId}` : '';

    this.logger.error(
      `${method} ${path} → ${status}${meta} | ${err.name}: ${err.message}`,
      err.stack,
      'Exceptions',
    );

    const prod = isProductionNodeEnv();
    const body: Record<string, unknown> = {
      statusCode: status,
      path,
      message: prod
        ? 'Internal server error'
        : err.message || 'Internal server error',
    };
    if (!prod) {
      body.error = err.name;
      if (driver.code) body.code = driver.code;
      if (driver.errno !== undefined) body.errno = driver.errno;
      if (driver.sqlMessage) body.sqlMessage = driver.sqlMessage;
    }

    response.status(status).json(body);
  }
}
