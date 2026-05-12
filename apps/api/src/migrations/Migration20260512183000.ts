import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/**
 * Quyền `support.read`: xem trang « Hỗ trợ đại lý » trên cổng admin.
 * Gán cho các role nội bộ (admin, manager, sales, shipper). `super_admin` đã có `*`.
 */
export class Migration20260512183000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(`
        insert into "permissions" ("createdAt", "updatedAt", "code", "name")
        select now(), now(), 'support.read', 'Xem trang hỗ trợ đại lý'
        where not exists (select 1 from "permissions" where "code" = 'support.read');
      `);
      this.addSql(`
        insert into "roles_permissions" ("createdAt", "updatedAt", "role_id", "permission_id")
        select now(), now(), r.id, p.id
        from "roles" r
        inner join "permissions" p on p."code" = 'support.read'
        where r."code" in ('admin','manager','sales','shipper')
          and not exists (
            select 1 from "roles_permissions" rp
            where rp."role_id" = r.id and rp."permission_id" = p.id
          );
      `);
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        insert ignore into \`permissions\` (\`createdAt\`, \`updatedAt\`, \`code\`, \`name\`)
        values (current_timestamp(6), current_timestamp(6), 'support.read', 'Xem trang hỗ trợ đại lý');
      `);
      this.addSql(`
        insert ignore into \`roles_permissions\` (\`createdAt\`, \`updatedAt\`, \`role_id\`, \`permission_id\`)
        select current_timestamp(6), current_timestamp(6), r.id, p.id
        from \`roles\` r
        inner join \`permissions\` p on p.\`code\` = 'support.read'
        where r.\`code\` in ('admin','manager','sales','shipper');
      `);
      return;
    }

    if (client === 'sqlite') {
      this.addSql(`
        insert or ignore into "permissions" ("createdAt", "updatedAt", "code", "name")
        values (datetime('now'), datetime('now'), 'support.read', 'Xem trang hỗ trợ đại lý');
      `);
      this.addSql(`
        insert or ignore into "roles_permissions" ("createdAt", "updatedAt", "role_id", "permission_id")
        select datetime('now'), datetime('now'), r.id, p.id
        from "roles" r
        inner join "permissions" p on p.code = 'support.read'
        where r.code in ('admin','manager','sales','shipper');
      `);
      return;
    }

    throw new Error(
      `Migration20260512183000: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(`
        delete from "roles_permissions"
        where "permission_id" in (select id from "permissions" where "code" = 'support.read');
      `);
      this.addSql(`delete from "permissions" where "code" = 'support.read';`);
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        delete rp from \`roles_permissions\` rp
        inner join \`permissions\` p on p.id = rp.\`permission_id\`
        where p.\`code\` = 'support.read';
      `);
      this.addSql(`
        delete from \`permissions\` where \`code\` = 'support.read';
      `);
      return;
    }

    if (client === 'sqlite') {
      this.addSql(`
        delete from "roles_permissions"
        where "permission_id" in (select id from "permissions" where code = 'support.read');
      `);
      this.addSql(`delete from "permissions" where code = 'support.read';`);
      return;
    }

    throw new Error(
      `Migration20260512183000 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
