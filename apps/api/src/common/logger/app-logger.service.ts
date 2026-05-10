import { ConsoleLogger, Injectable, type LogLevel } from '@nestjs/common';

export interface LogPayload {
  level: LogLevel;
  service: string;
  context?: string;
  pid: number;
  timestamp: string;
  message: unknown;
  trace?: unknown;
  meta?: unknown[];
}

/**
 * Centralised logger for the @api microservice.
 *
 * - Emits structured JSON in production so log aggregators (Datadog, ELK,
 *   CloudWatch, Loki, ...) can parse and index every entry out of the box.
 * - Falls back to NestJS' colourised pretty output during local development
 *   for readability.
 * - Adds the deployed `SERVICE_NAME` to every entry which makes filtering
 *   inside a multi-service environment trivial.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  private readonly serviceName = process.env.SERVICE_NAME ?? '@api';
  private readonly useJson = process.env.NODE_ENV === 'production';
  private readonly enabledLevels: ReadonlyArray<LogLevel> = (
    (process.env.LOG_LEVELS ?? 'log,error,warn,debug,verbose,fatal').split(
      ',',
    ) as LogLevel[]
  ).map((level) => level.trim() as LogLevel);

  log(message: unknown, ...rest: unknown[]): void {
    this.emit('log', message, rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    this.emit('error', message, rest);
  }

  warn(message: unknown, ...rest: unknown[]): void {
    this.emit('warn', message, rest);
  }

  debug(message: unknown, ...rest: unknown[]): void {
    this.emit('debug', message, rest);
  }

  verbose(message: unknown, ...rest: unknown[]): void {
    this.emit('verbose', message, rest);
  }

  fatal(message: unknown, ...rest: unknown[]): void {
    this.emit('fatal', message, rest);
  }

  private emit(level: LogLevel, message: unknown, rest: unknown[]): void {
    if (!this.enabledLevels.includes(level)) return;

    if (!this.useJson) {
      // Delegate to NestJS' built-in colourised renderer for local DX.
      const args: [unknown, ...unknown[]] = [message, ...rest];
      switch (level) {
        case 'log':
          super.log(...args);
          return;
        case 'error':
          super.error(...args);
          return;
        case 'warn':
          super.warn(...args);
          return;
        case 'debug':
          super.debug(...args);
          return;
        case 'verbose':
          super.verbose(...args);
          return;
        case 'fatal':
          super.fatal(...args);
          return;
      }
    }

    const { context, trace, meta } = this.extractParts(level, rest);
    const payload: LogPayload = {
      level,
      service: this.serviceName,
      context: context ?? this.context,
      pid: process.pid,
      timestamp: new Date().toISOString(),
      message: this.normaliseMessage(message),
      ...(trace ? { trace } : {}),
      ...(meta && meta.length ? { meta } : {}),
    };

    const stream = level === 'error' || level === 'fatal' ? 'stderr' : 'stdout';
    process[stream].write(`${JSON.stringify(payload)}\n`);
  }

  private normaliseMessage(message: unknown): unknown {
    if (message instanceof Error) {
      return {
        name: message.name,
        message: message.message,
        stack: message.stack,
      };
    }
    return message;
  }

  private extractParts(
    level: LogLevel,
    rest: unknown[],
  ): { context?: string; trace?: unknown; meta?: unknown[] } {
    if (rest.length === 0) return {};

    // NestJS calls .error(message, trace, context) and the others as
    // .log(message, ...meta, context). The final string argument is treated as
    // the context to mirror the framework's own contract.
    const tail = rest[rest.length - 1];
    const hasContext = typeof tail === 'string' && rest.length >= 1;
    const context = hasContext ? tail : undefined;
    const body = hasContext ? rest.slice(0, -1) : rest;

    if (level === 'error' || level === 'fatal') {
      const [trace, ...meta] = body;
      return { context, trace, meta };
    }
    return { context, meta: body };
  }
}
