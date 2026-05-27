import 'dotenv/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  json,
  urlencoded,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { appConfig } from './config/app.config';
import { DatabaseHttpExceptionFilter } from './common/database-http-exception.filter';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { ApiAccessMiddleware } from './common/api-access.middleware';

/**
 * Reverse-proxy đôi khi strip `/api` (vd. Nginx `location /api/` + `proxy_pass .../`)
 * nên request tới Nest là `/admin/...`, `/public/...`, `/auth/...` thay vì `/api/...`.
 * Chuẩn hóa lại trước `setGlobalPrefix('api')`.
 */
function rewritePathsMissingGlobalApiPrefix(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const segment =
    (appConfig.globalPrefix || 'api').replace(/^\/+|\/+$/g, '') || 'api';
  const prefixPath = `/${segment}`;
  const pathname = req.path || '';
  if (pathname === prefixPath || pathname.startsWith(`${prefixPath}/`)) {
    return next();
  }
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const strip = pathname.replace(/\/$/, '');
  const needPrefix =
    strip === '/auth' ||
    pathname.startsWith('/auth/') ||
    strip === '/admin' ||
    pathname.startsWith('/admin/') ||
    strip === '/public' ||
    pathname.startsWith('/public/') ||
    /* Socket.IO: proxy đôi khi chỉ forward /socket thay vì /api/socket */
    strip === '/socket' ||
    pathname.startsWith('/socket/');
  if (needPrefix) {
    req.url = `${prefixPath}${pathname}${qs}`;
  }
  next();
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.set('trust proxy', 1);

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new DatabaseHttpExceptionFilter(httpAdapterHost));
  app.use(json({ limit: appConfig.bodyLimit }));
  app.use(urlencoded({ extended: true, limit: appConfig.bodyLimit }));
  app.use(rewritePathsMissingGlobalApiPrefix);
  app.setGlobalPrefix(appConfig.globalPrefix);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.enableCors({
    origin: appConfig.allowedOrigins,
    ...appConfig.cors,
  });
  app.use(RequestIdMiddleware);
  app.use(ApiAccessMiddleware);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalInterceptors(new LoggingInterceptor());

  const logger = new Logger('Bootstrap');

  // Swagger API Documentation
  if (appConfig.nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Store Sync API')
      .setDescription('API documentation for Store Sync platform')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addServer(`http://localhost:${appConfig.port}`, 'Local Development')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Store Sync API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
    logger.log(`Swagger Docs: http://localhost:${appConfig.port}/api/docs`);
  }

  await app.listen(appConfig.port);

  const dbUrl = appConfig.databaseUrl
    ? appConfig.databaseUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@')
    : 'N/A';
  const origins =
    appConfig.allowedOrigins === true
      ? 'ALL (*true*)'
      : appConfig.allowedOrigins.join(', ');

  logger.log(
    `\n╔═══════════════════════════════════════════════════════════\n` +
      `║  API Server Started Successfully                          \n` +
      `╠═══════════════════════════════════════════════════════════\n` +
      `║  Port         : ${appConfig.port}\n` +
      `║  Environment  : ${appConfig.nodeEnv}\n` +
      `║  Global Prefix: /${appConfig.globalPrefix}\n` +
      `║  Storage Dir  : ${appConfig.storageDir}\n` +
      `║  CORS Origins : ${origins}\n` +
      `║  Database     : ${dbUrl}\n` +
      `╚═══════════════════════════════════════════════════════════`,
  );

  const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of shutdownSignals) {
    process.on(signal, () => {
      logger.log(`Received ${signal}. Graceful shutdown...`);
      app
        .close()
        .then(() => {
          logger.log('Server closed. Goodbye.');
          process.exit(0);
        })
        .catch(() => process.exit(1));
    });
  }
}

function maskBootstrapError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: unknown }).code === 'EADDRINUSE'
  ) {
    return `Cổng ${appConfig.port} đã được sử dụng (EADDRINUSE).`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  const msg = maskBootstrapError(err);
  logger.error(
    `\n┌── BOOTSTRAP FAILED ─────────────────────────\n│  ${msg}\n└─────────────────────────────────────────────`,
  );
  process.exit(1);
});
