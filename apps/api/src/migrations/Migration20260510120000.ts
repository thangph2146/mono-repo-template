import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/** Gán shipper cho đơn — FK tới `users` (PostgreSQL + MySQL; các dialect khác cần bổ sung). */
export class Migration20260510120000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql' || client === 'sqlite') {
      this.addSql(`
        alter table "orders"
        add column "assignedShipperId" int null;
      `);
      this.addSql(`
        alter table "orders"
        add constraint "orders_assigned_shipper_id_foreign"
        foreign key ("assignedShipperId") references "users" ("id")
        on delete set null;
      `);
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        alter table \`orders\`
        add \`assignedShipperId\` int unsigned null;
      `);
      this.addSql(`
        alter table \`orders\`
        add constraint \`orders_assigned_shipper_id_foreign\`
        foreign key (\`assignedShipperId\`) references \`users\` (\`id\`)
        on delete set null;
      `);
      return;
    }

    throw new Error(
      `Migration20260510120000: dialect "${client}" chưa được hỗ trợ cho cột assignedShipperId — cấu hình PostgreSQL/MySQL hoặc bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql' || client === 'sqlite') {
      this.addSql(
        'alter table "orders" drop constraint "orders_assigned_shipper_id_foreign";',
      );
      this.addSql('alter table "orders" drop column "assignedShipperId";');
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        alter table \`orders\` drop foreign key \`orders_assigned_shipper_id_foreign\`;
      `);
      this.addSql(`
        alter table \`orders\` drop column \`assignedShipperId\`;
      `);
      return;
    }

    throw new Error(
      `Migration20260510120000 (down): dialect "${client}" chưa được hỗ trợ.`,
    );
  }
}
