/**
 * MikroORM CLI configuration.
 *
 * Loaded by `pnpm exec mikro-orm` (via `@mikro-orm/cli`) to drive schema
 * synchronisation, migrations, and seeders. The runtime NestJS app uses the
 * same logical config via `getMikroOrmConfig` so the CLI cannot drift from
 * what the service uses in production.
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Monorepo: cho phép `.env` ở thư mục gốc repo hoặc `apps/api` (local ghi đè).
loadEnv({ path: resolve(process.cwd(), '..', '.env') });
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });
import { defineConfig } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { ConfigService } from '@nestjs/config';
import { createMikroConfig } from './src/mikro-orm/mikro-orm.module';

const configService = new ConfigService(process.env);
const baseConfig = createMikroConfig(configService);

export default defineConfig({
  ...(baseConfig as any),
  // Use compiled JS entities when running against `dist/`, fall back to TS
  // when using ts-node for the CLI.
  entities: ['./dist/entities/*.entity.js'],
  entitiesTs: ['./src/entities/*.entity.ts'],
  extensions: [Migrator, SeedManager],
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    allOrNothing: true,
    emit: 'ts',
    snapshot: true,
  },
  seeder: {
    path: './dist/seeders',
    pathTs: './src/seeders',
    defaultSeeder: 'DatabaseSeeder',
    glob: '!(*.d).{js,ts}',
    emit: 'ts',
  },
} as any);
