import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/**
 * Đảm bảo cột `fulfillmentNote` tồn tại trên `products` (MySQL / SQLite nếu migration
 * trước chưa chạy hoặc DB cũ thiếu cột).
 */
export class Migration20260511203000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "products" add column if not exists "fulfillmentNote" text null;',
      );
      return;
    }

    if (client === 'mysql') {
      // Cùng một phiên kết nối: biến user giữ giữa các câu lệnh.
      this.addSql(`
        set @__col_exists := (
          select count(*) from information_schema.columns
          where table_schema = database()
            and table_name = 'products'
            and column_name = 'fulfillmentNote'
        )
      `);
      this.addSql(`
        set @__ddl := if(
          @__col_exists > 0,
          'select 1 as __skip_fulfillment_note',
          'alter table \`products\` add column \`fulfillmentNote\` text null'
        )
      `);
      this.addSql('prepare __stmt_fulfillment_note from @__ddl');
      this.addSql('execute __stmt_fulfillment_note');
      this.addSql('deallocate prepare __stmt_fulfillment_note');
      return;
    }

    if (client === 'sqlite') {
      this.addSql(
        'alter table "products" add column "fulfillmentNote" text null;',
      );
      return;
    }

    throw new Error(
      `Migration20260511203000: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
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

    if (client === 'mysql') {
      this.addSql('alter table `products` drop column `fulfillmentNote`;');
      return;
    }

    if (client === 'sqlite') {
      this.addSql('alter table "products" drop column "fulfillmentNote";');
      return;
    }

    throw new Error(
      `Migration20260511203000 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
