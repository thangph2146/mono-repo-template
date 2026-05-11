import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';
import { AppLogger, registerDevHttpLogging } from './common/logger';

const isDev = process.env.NODE_ENV === 'development';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: isDev
      ? ['error', 'warn', 'log', 'debug', 'verbose']
      : ['error', 'warn', 'log'],
  });
  app.use(json({ limit: '50mb' }));

  // Replace the default Nest logger with our centralised one as soon as the
  // DI graph is ready so every framework log respects the shared format.
  const appLogger = app.get(AppLogger);
  appLogger.setContext('Bootstrap');
  app.useLogger(appLogger);
  registerDevHttpLogging(app, appLogger);

  const apiPrefix = (process.env.API_PREFIX ?? 'api').trim();
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    /** GET/POST từ admin (3001) gửi X-User-Id / X-Backup-Secret → trình duyệt bắt buộc preflight. */
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-User-Id',
      'X-Backup-Secret',
    ],
  });

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);

  appLogger.log(`@api microservice listening on http://localhost:${port}`);
}

void bootstrap();
