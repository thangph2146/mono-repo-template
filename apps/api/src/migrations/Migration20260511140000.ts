import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/** Xóa mềm: `categories`, `orders`, `users` — cột `deletedAt`. */
export class Migration20260511140000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "categories" add column "deletedAt" timestamptz null;',
      );
      this.addSql(
        'alter table "orders" add column "deletedAt" timestamptz null;',
      );
      this.addSql(
        'alter table "users" add column "deletedAt" timestamptz null;',
      );
      return;
    }

    if (client === 'sqlite') {
      this.addSql(
        'alter table "categories" add column "deletedAt" datetime null;',
      );
      this.addSql('alter table "orders" add column "deletedAt" datetime null;');
      this.addSql('alter table "users" add column "deletedAt" datetime null;');
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        alter table \`categories\`
        add column \`deletedAt\` datetime(6) null;
      `);
      this.addSql(`
        alter table \`orders\`
        add column \`deletedAt\` datetime(6) null;
      `);
      this.addSql(`
        alter table \`users\`
        add column \`deletedAt\` datetime(6) null;
      `);
      return;
    }

    throw new Error(
      `Migration20260511140000: dialect "${client}" chưa hỗ trợ — bổ sung SQL.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(
        'alter table "categories" drop column if exists "deletedAt";',
      );
      this.addSql('alter table "orders" drop column if exists "deletedAt";');
      this.addSql('alter table "users" drop column if exists "deletedAt";');
      return;
    }

    if (client === 'sqlite') {
      this.addSql('alter table "categories" drop column "deletedAt";');
      this.addSql('alter table "orders" drop column "deletedAt";');
      this.addSql('alter table "users" drop column "deletedAt";');
      return;
    }

    if (client === 'mysql') {
      this.addSql('alter table `categories` drop column `deletedAt`;');
      this.addSql('alter table `orders` drop column `deletedAt`;');
      this.addSql('alter table `users` drop column `deletedAt`;');
      return;
    }

    throw new Error(
      `Migration20260511140000 (down): dialect "${client}" chưa hỗ trợ.`,
    );
  }
}
