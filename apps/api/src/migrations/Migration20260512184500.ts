import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/**
 * Bảng ghi đè nội dung hỗ trợ đại lý + quyền `support.write` (admin, manager).
 */
export class Migration20260512184500 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(`
        create table if not exists "dealer_support_contents" (
          "id" serial primary key,
          "createdAt" timestamptz not null default now(),
          "updatedAt" timestamptz not null default now(),
          "overrides" jsonb not null default '{}'::jsonb
        );
      `);
      this.addSql(`
        insert into "dealer_support_contents" ("createdAt", "updatedAt", "overrides")
        select now(), now(), '{}'::jsonb
        where not exists (select 1 from "dealer_support_contents" limit 1);
      `);
      this.addSql(`
        insert into "permissions" ("createdAt", "updatedAt", "code", "name")
        select now(), now(), 'support.write', 'Sửa nội dung hỗ trợ đại lý (cửa hàng)'
        where not exists (select 1 from "permissions" where "code" = 'support.write');
      `);
      this.addSql(`
        insert into "roles_permissions" ("createdAt", "updatedAt", "role_id", "permission_id")
        select now(), now(), r.id, p.id
        from "roles" r
        inner join "permissions" p on p."code" = 'support.write'
        where r."code" in ('admin','manager')
          and not exists (
            select 1 from "roles_permissions" rp
            where rp."role_id" = r.id and rp."permission_id" = p.id
          );
      `);
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        create table if not exists \`dealer_support_contents\` (
          \`id\` int unsigned not null auto_increment,
          \`createdAt\` datetime not null default current_timestamp,
          \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
          \`overrides\` json not null,
          primary key (\`id\`)
        ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
      `);
      this.addSql(`
        insert into \`dealer_support_contents\` (\`createdAt\`, \`updatedAt\`, \`overrides\`)
        select current_timestamp(6), current_timestamp(6), '{}'
        where not exists (select 1 from \`dealer_support_contents\` limit 1);
      `);
      this.addSql(`
        insert ignore into \`permissions\` (\`createdAt\`, \`updatedAt\`, \`code\`, \`name\`)
        values (current_timestamp(6), current_timestamp(6), 'support.write', 'Sửa nội dung hỗ trợ đại lý (cửa hàng)');
      `);
      this.addSql(`
        insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
        select current_timestamp(6), current_timestamp(6), r.id, p.id
        from \`roles\` r
        inner join \`permissions\` p on p.\`code\` = 'support.write'
        where r.\`code\` in ('admin','manager');
      `);
      return;
    }

    if (client === 'sqlite') {
      this.addSql(`
        create table if not exists "dealer_support_contents" (
          "id" integer not null primary key autoincrement,
          "createdAt" datetime not null default (datetime('now')),
          "updatedAt" datetime not null default (datetime('now')),
          "overrides" text not null default '{}'
        );
      `);
      this.addSql(`
        insert into "dealer_support_contents" ("createdAt", "updatedAt", "overrides")
        select datetime('now'), datetime('now'), '{}'
        where not exists (select 1 from "dealer_support_contents" limit 1);
      `);
      this.addSql(`
        insert or ignore into "permissions" ("createdAt", "updatedAt", "code", "name")
        values (datetime('now'), datetime('now'), 'support.write', 'Sửa nội dung hỗ trợ đại lý (cửa hàng)');
      `);
      this.addSql(`
        insert or ignore into "roles_permissions" ("createdAt", "updatedAt", "role_id", "permission_id")
        select datetime('now'), datetime('now'), r.id, p.id
        from "roles" r
        inner join "permissions" p on p.code = 'support.write'
        where r.code in ('admin','manager');
      `);
      return;
    }

    throw new Error(
      `Migration20260512184500: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(`drop table if exists "dealer_support_contents" cascade;`);
      this.addSql(`
        delete from "roles_permissions"
        where "permission_id" in (select id from "permissions" where "code" = 'support.write');
      `);
      this.addSql(`delete from "permissions" where "code" = 'support.write';`);
      return;
    }

    if (client === 'mysql') {
      this.addSql(`drop table if exists \`dealer_support_contents\`;`);
      this.addSql(`
        delete rp from \`roles_permissions\` rp
        inner join \`permissions\` p on p.id = rp.\`permission_id\`
        where p.\`code\` = 'support.write';
      `);
      this.addSql(
        `delete from \`permissions\` where \`code\` = 'support.write';`,
      );
      return;
    }

    if (client === 'sqlite') {
      this.addSql(`drop table if exists "dealer_support_contents";`);
      this.addSql(`
        delete from "roles_permissions"
        where "permission_id" in (select id from "permissions" where code = 'support.write');
      `);
      this.addSql(`delete from "permissions" where code = 'support.write';`);
      return;
    }

    throw new Error(
      `Migration20260512184500 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
