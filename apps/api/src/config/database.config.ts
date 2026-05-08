import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  client: 'postgresql' | 'mongodb' | 'mysql' | 'sqlite' | 'mssql';
  connectionString: string;
  dbName?: string;
  entities: string[];
  debug?: boolean;
  migrations?: {
    path: string;
    pathTs: string;
  };
}

export const getMikroOrmConfig = (
  configService: ConfigService,
): MikroOrmModuleOptions => {
  const connectionString = configService.get<string>('DATABASE_URL', '');
  let client = configService.get<DatabaseConfig['client']>('DB_CLIENT');

  // Detect client from connection string if not explicitly provided
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

  // Default to postgresql if still not determined
  client = client || 'postgresql';

  const baseOptions = {
    entities: ['./dist/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    debug: configService.get<boolean>('DB_DEBUG', false),
    migrations: {
      path: './migrations',
      pathTs: './src/migrations',
    },
  };

  if (connectionString) {
    const parsed = parseConnectionString(connectionString, client);
    return {
      ...baseOptions,
      ...parsed,
      driver: client,
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
    driver: client,
    host,
    port,
    user,
    password,
    dbName,
  } as unknown as MikroOrmModuleOptions;
};

function parseConnectionString(
  connectionString: string,
  client: DatabaseConfig['client'],
) {
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

function getDefaultPort(client: DatabaseConfig['client']): number {
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
