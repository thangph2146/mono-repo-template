import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/** Xóa mềm sản phẩm — cột `deletedAt` (null = đang hiển thị trong kho). */
export class Migration20260511120000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "products" add column "deletedAt" timestamptz null;',
      );
      return;
    }

    if (client === 'sqlite') {
      this.addSql(
        'alter table "products" add column "deletedAt" datetime null;',
      );
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        alter table \`products\`
        add column \`deletedAt\` datetime(6) null;
      `);
      return;
    }

    throw new Error(
      `Migration20260511120000: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql('alter table "products" drop column if exists "deletedAt";');
      return;
    }

    if (client === 'sqlite') {
      // SQLite ≥ 3.35 — nếu DB cũ hơn, hạ migration thủ công.
      this.addSql('alter table "products" drop column "deletedAt";');
      return;
    }

    if (client === 'mysql') {
      this.addSql('alter table `products` drop column `deletedAt`;');
      return;
    }

    throw new Error(
      `Migration20260511120000 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
