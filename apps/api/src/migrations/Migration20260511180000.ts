import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/** Ghi chú quà tặng / điều kiện KM cho shipper (sản phẩm). */
export class Migration20260511180000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "products" add column "fulfillmentNote" text null;',
      );
      return;
    }

    if (client === 'sqlite') {
      this.addSql(
        'alter table "products" add column "fulfillmentNote" text null;',
      );
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        alter table \`products\`
        add column \`fulfillmentNote\` text null;
      `);
      return;
    }

    throw new Error(
      `Migration20260511180000: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "products" drop column if exists "fulfillmentNote";',
      );
      return;
    }

    if (client === 'sqlite') {
      this.addSql('alter table "products" drop column "fulfillmentNote";');
      return;
    }

    if (client === 'mysql') {
      this.addSql('alter table `products` drop column `fulfillmentNote`;');
      return;
    }

    throw new Error(
      `Migration20260511180000 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
