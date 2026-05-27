import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { EntityCaseNamingStrategy, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { ormEntities } from '../src/mikro-orm/orm-entities';

export async function createTestModule(
  overrides: {
    providers?: any[];
    controllers?: any[];
    imports?: any[];
  } = {},
): Promise<{
  module: TestingModule;
  app: INestApplication;
  orm: MikroORM;
}> {
  const module = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot({
        entities: [...ormEntities],
        dbName: ':memory:',
        driver: SqliteDriver,
        namingStrategy: EntityCaseNamingStrategy,
        allowGlobalContext: true,
      }),
      ...(overrides.imports || []),
    ],
    providers: overrides.providers || [],
    controllers: overrides.controllers || [],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const orm = module.get(MikroORM);
  await orm.getSchemaGenerator().refreshDatabase();

  return { module, app, orm };
}

export async function closeTestApp({
  app,
  orm,
}: {
  app: INestApplication;
  orm: MikroORM;
}): Promise<void> {
  await orm.getSchemaGenerator().dropSchema();
  await app.close();
}
