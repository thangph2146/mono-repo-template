import 'reflect-metadata';
import { config } from 'dotenv';
import { MikroORM, EntityCaseNamingStrategy } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MySqlDriver } from '@mikro-orm/mysql';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { PageContent } from './entities/page-content.entity';
import { runSuperadminBootstrap } from './seeds/superadmin-bootstrap.runner';

config();

function getDriver() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres')) return PostgreSqlDriver;
  if (dbUrl.startsWith('sqlite')) return SqliteDriver;
  return MySqlDriver;
}

async function seedData() {
  const orm = await MikroORM.init({
    driver: getDriver() as any,
    clientUrl: process.env.DATABASE_URL,
    entities: [User, Role, UserRole, PageContent],
    namingStrategy: EntityCaseNamingStrategy,
    debug: false,
  });

  const em = orm.em.fork();
  await runSuperadminBootstrap(em, console.log);
  console.log('Data seed completed successfully!');
  await orm.close();
}

seedData().catch((error) => {
  console.error('Error seeding data:', error);
  process.exit(1);
});
