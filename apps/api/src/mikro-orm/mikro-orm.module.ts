import { ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { defineConfig, EntityCaseNamingStrategy, Options, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { ormEntities } from './orm-entities';

const SUPPORTED_DATABASE_TYPES = [
  'mysql',
  'mariadb',
  'postgres',
  'sqlite',
] as const;
type SupportedDbType = (typeof SUPPORTED_DATABASE_TYPES)[number];

function resolveDbType(raw?: string | null): SupportedDbType {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return 'mysql';
  if (normalized === 'postgresql') return 'postgres';
  if (SUPPORTED_DATABASE_TYPES.includes(normalized as SupportedDbType))
    return normalized as SupportedDbType;
  return 'mysql';
}

function isSqliteFamily(type: SupportedDbType): boolean {
  return type === 'sqlite';
}

export function createMikroConfig(configService: ConfigService): Options<any> {
  const type = resolveDbType(configService.get<string>('DB_TYPE'));
  const debug = configService.get<string>('NODE_ENV') === 'development';

  const baseConfig: Options<any> = {
    entities: [...ormEntities],
    debug,
    namingStrategy: EntityCaseNamingStrategy,
    migrations: {
      path: 'src/migrations',
      pathTs: 'src/migrations',
    },
  };

  if (isSqliteFamily(type)) {
    return {
      ...baseConfig,
      driver: SqliteDriver,
      dbName: configService.get<string>('DB_DATABASE') || 'tuyen-sinh.sqlite',
    };
  }

  const url = configService.get<string>('DATABASE_URL');
  const Driver = type === 'postgres' ? PostgreSqlDriver : MySqlDriver;

  if (url) {
    return {
      ...baseConfig,
      driver: Driver,
      clientUrl: url,
      ...(type !== 'postgres' && { charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' }),
    };
  }

  return {
    ...baseConfig,
    driver: Driver,
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: Number(configService.get<string>('DB_PORT') || 3306),
    user: configService.get<string>('DB_USERNAME') || 'root',
    password: configService.get<string>('DB_PASSWORD') || '',
    dbName: configService.get<string>('DB_DATABASE') || 'tuyen_sinh',
    ...(type !== 'postgres' && { charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' }),
  };
}

@Global()
@Module({
  imports: [
    MikroOrmModule.forRoot(createMikroConfig(new ConfigService(process.env))),
  ],
})
export class DatabaseModule {}
