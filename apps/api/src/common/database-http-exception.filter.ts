import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { createErrorResponse } from './api-response';

@Catch()
@Injectable()
export class DatabaseHttpExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(DatabaseHttpExceptionFilter.name);
  private readonly errorMaxLen = 20000;

  constructor(httpAdapterHost?: HttpAdapterHost) {
    super(httpAdapterHost?.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const method = req?.method ?? '-';
    const url = req?.originalUrl ?? req?.url ?? '-';
    const userId = (req?.headers?.['x-user-id'] as string | undefined) ?? '-';
    const requestId =
      (req?.headers?.['x-request-id'] as string | undefined) ?? '-';
    const query = this.safeJson(req?.query ?? {});
    const requestBody = this.safeJson(req?.body ?? {});

    if (exception instanceof Error) {
      const err = exception as any;
      const code = err.code || err.driverError?.code || err.sqlState;

      let message = '';
      if (
        code === 'ER_DUP_ENTRY' ||
        code === '23505' ||
        err.message?.toLowerCase().includes('unique constraint')
      ) {
        message =
          'Giá trị này đã tồn tại (trùng dữ liệu). Vui lòng chọn giá trị khác.';
      } else if (
        code === 'ER_ROW_IS_REFERENCED_2' ||
        code === '23503' ||
        err.message?.toLowerCase().includes('foreign key constraint')
      ) {
        message = 'Tham chiếu không hợp lệ. Kiểm tra dữ liệu liên quan.';
      }

      if (message) {
        this.logger.warn(
          `[${method}] ${url} | user=${userId} | req=${requestId} | ${message}`,
          JSON.stringify(
            {
              code,
              error: err.message,
              sql: err.sql,
              sqlMessage: err.sqlMessage,
              query,
              body: requestBody,
            },
            null,
            2,
          ),
        );
        const { statusCode, body: errorBody } = createErrorResponse(message, {
          status: HttpStatus.BAD_REQUEST,
        });
        res.status(statusCode).json(errorBody);
        return;
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : ((response as { message?: unknown })?.message ?? 'Request failed');
      const normalizedMessage = Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string'
          ? message
          : this.safeJson(message);

      this.logger.warn(
        `[${method}] ${url} | user=${userId} | req=${requestId} | status=${status} | ${normalizedMessage}`,
        JSON.stringify(
          {
            response,
            query,
            body: requestBody,
            stack:
              exception instanceof Error
                ? exception.stack?.split('\n').slice(0, 20).join('\n')
                : undefined,
          },
          null,
          2,
        ),
      );
      const { statusCode, body: errorBody } = createErrorResponse(
        normalizedMessage,
        {
          status,
        },
      );
      res.status(statusCode).json(errorBody);
      return;
    }

    const errorMessage =
      exception instanceof Error ? exception.message : 'Internal server error';
    this.logger.error(
      `[${method}] ${url} | user=${userId} | req=${requestId} | status=500 | ${errorMessage}`,
      JSON.stringify(
        {
          query,
          body: requestBody,
          details: this.extractErrorDetails(exception),
        },
        null,
        2,
      ),
    );
    const { statusCode, body: errorBody } = createErrorResponse(
      'Internal server error',
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    );
    res.status(statusCode).json(errorBody);
  }

  private extractErrorDetails(exception: unknown): Record<string, unknown> {
    if (!(exception instanceof Error)) {
      return { raw: this.safeJson(exception) };
    }

    const err = exception as any;
    return {
      name: exception.name,
      message: exception.message,
      code: err.code,
      status: err.status ?? err.statusCode,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      sql: err.sql,
      driverError: err.driverError,
      response: err.response,
      stack: exception.stack?.split('\n').slice(0, 20).join('\n'),
    };
  }

  private safeJson(value: unknown): string {
    try {
      const text = JSON.stringify(value);
      if (typeof text !== 'string') return '-';
      return text.length > this.errorMaxLen
        ? `${text.slice(0, this.errorMaxLen)}...`
        : text;
    } catch {
      return '[unserializable]';
    }
  }
}
