import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { MongoDriver } from '@mikro-orm/mongodb';
import type { IDatabaseDriver, Configuration } from '@mikro-orm/core';

type DbClient = 'postgresql' | 'mongodb' | 'mysql' | 'sqlite' | 'mssql';

type DriverClass = new (
  config: Configuration<IDatabaseDriver>,
) => IDatabaseDriver;

export interface DatabaseConfig {
  client: DbClient;
  connectionString: string;
  dbName?: string;
  entities: string[];
  debug?: boolean;
  migrations?: {
    path: string;
    pathTs: string;
  };
}

const DRIVER_MAP: Record<DbClient, DriverClass> = {
  postgresql: PostgreSqlDriver as unknown as DriverClass,
  mysql: MySqlDriver as unknown as DriverClass,
  sqlite: SqliteDriver as unknown as DriverClass,
  mssql: MsSqlDriver as unknown as DriverClass,
  mongodb: MongoDriver as unknown as DriverClass,
};

/** Dùng chung cho ConfigService và cho `driver` của MikroOrmModule.forRootAsync. */
export function inferDbClient(
  connectionString: string,
  explicitClient: DbClient | undefined,
): DbClient {
  let client = explicitClient;

  if (!client && connectionString) {
    if (
      connectionString.startsWith('postgresql://') ||
      connectionString.startsWith('postgres://')
    ) {
      client = 'postgresql';
    } else if (connectionString.startsWith('mysql://')) {
      client = 'mysql';
    } else if (
      connectionString.startsWith('sqlserver://') ||
      connectionString.startsWith('mssql://')
    ) {
      client = 'mssql';
    } else if (connectionString.startsWith('mongodb://')) {
      client = 'mongodb';
    } else if (
      connectionString.endsWith('.sqlite') ||
      connectionString.startsWith('sqlite://')
    ) {
      client = 'sqlite';
    }
  }

  return client || 'postgresql';
}

/**
 * Đọc `process.env` sau khi `ConfigModule` đã nạp `.env` (đặt `ConfigModule` trước `MikroOrmModule` trong `AppModule`).
 * Bắt buộc cho @mikro-orm/nestjs khi dùng forRootAsync + useFactory — xem PR #204.
 */
export function getMikroOrmDriverClassForNest(): DriverClass {
  const connectionString = process.env.DATABASE_URL ?? '';
  const explicit = process.env.DB_CLIENT as DbClient | undefined;
  const client = inferDbClient(connectionString, explicit);
  return DRIVER_MAP[client];
}

export const getMikroOrmConfig = (
  configService: ConfigService,
): MikroOrmModuleOptions => {
  const connectionString = configService.get<string>('DATABASE_URL', '');
  const client = inferDbClient(
    connectionString,
    configService.get<DbClient>('DB_CLIENT'),
  );

  const driver = DRIVER_MAP[client];

  const baseOptions = {
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    debug: configService.get<boolean>('DB_DEBUG', false),
    migrations: {
      path: './dist/migrations',
      pathTs: './src/migrations',
      glob: '!(*.d).{js,ts}',
      transactional: true,
      allOrNothing: true,
    },
  };

  if (connectionString) {
    const parsed = parseConnectionString(connectionString, client);
    return {
      ...baseOptions,
      ...parsed,
      driver,
    } as unknown as MikroOrmModuleOptions;
  }

  // Fallback to individual env vars
  const host = configService.get<string>('DB_HOST', 'localhost');
  const port = configService.get<number>('DB_PORT', getDefaultPort(client));
  const user = configService.get<string>('DB_USER', '');
  const password = configService.get<string>('DB_PASSWORD', '');
  const dbName = configService.get<string>(
    'DB_NAME',
    client === 'sqlite' ? './data.sqlite' : 'storesync',
  );

  return {
    ...baseOptions,
    driver,
    host,
    port,
    user,
    password,
    dbName,
  } as unknown as MikroOrmModuleOptions;
};

function parseConnectionString(connectionString: string, client: DbClient) {
  if (client === 'sqlite') {
    const dbName = connectionString.replace(/^sqlite:\/\//, '');
    return { dbName };
  }

  if (client === 'mongodb') {
    return { clientUrl: connectionString };
  }

  if (client === 'mssql') {
    try {
      const cleanUrl = connectionString
        .replace(/^sqlserver:\/\//, 'http://')
        .replace(/^mssql:\/\//, 'http://');
      const url = new URL(cleanUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 1433,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        dbName: url.pathname.replace(/^\//, ''),
      };
    } catch {
      return { clientUrl: connectionString };
    }
  }

  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port) || getDefaultPort(client),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      dbName: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return { clientUrl: connectionString };
  }
}

function getDefaultPort(client: DbClient): number {
  switch (client) {
    case 'postgresql':
      return 5432;
    case 'mysql':
      return 3306;
    case 'mssql':
      return 1433;
    case 'mongodb':
      return 27017;
    default:
      return 5432;
  }
}
