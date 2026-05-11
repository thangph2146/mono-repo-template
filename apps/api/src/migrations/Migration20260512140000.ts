import { Migration } from '@mikro-orm/migrations';
import { inferDbClient } from '../config/database.config';

type SqlClient = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

/** Bảng `promo_codes` — mã giảm giá toàn đơn (quản trị + áp khi checkout). */
export class Migration20260512140000 extends Migration {
  override up(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql') {
      this.addSql(`
        create table if not exists "promo_codes" (
          "id" serial primary key,
          "createdAt" timestamptz not null default now(),
          "updatedAt" timestamptz not null default now(),
          "code" varchar(32) not null,
          "label" varchar(200) not null,
          "discountKind" varchar(16) not null,
          "discountFixed" int not null default 0,
          "discountPercent" int not null default 0,
          "discountCapVnd" int null,
          "minOrderSubtotal" int not null default 0,
          "isActive" boolean not null default true,
          "validFrom" timestamptz null,
          "validUntil" timestamptz null,
          "usageLimit" int null,
          "usageCount" int not null default 0,
          constraint "promo_codes_code_unique" unique ("code")
        );
      `);
      this.addSql(
        'create index if not exists "promo_codes_is_active_idx" on "promo_codes" ("isActive");',
      );
      return;
    }

    if (client === 'mysql') {
      this.addSql(`
        create table if not exists \`promo_codes\` (
          \`id\` int unsigned not null auto_increment,
          \`createdAt\` datetime not null default current_timestamp,
          \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
          \`code\` varchar(32) not null,
          \`label\` varchar(200) not null,
          \`discountKind\` varchar(16) not null,
          \`discountFixed\` int not null default 0,
          \`discountPercent\` int not null default 0,
          \`discountCapVnd\` int null,
          \`minOrderSubtotal\` int not null default 0,
          \`isActive\` tinyint(1) not null default 1,
          \`validFrom\` datetime null,
          \`validUntil\` datetime null,
          \`usageLimit\` int null,
          \`usageCount\` int not null default 0,
          primary key (\`id\`),
          unique key \`promo_codes_code_unique\` (\`code\`),
          key \`promo_codes_is_active_idx\` (\`isActive\`)
        ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
      `);
      return;
    }

    if (client === 'sqlite') {
      this.addSql(`
        create table if not exists "promo_codes" (
          "id" integer not null primary key autoincrement,
          "createdAt" datetime not null default (datetime('now')),
          "updatedAt" datetime not null default (datetime('now')),
          "code" text not null,
          "label" text not null,
          "discountKind" text not null,
          "discountFixed" integer not null default 0,
          "discountPercent" integer not null default 0,
          "discountCapVnd" integer null,
          "minOrderSubtotal" integer not null default 0,
          "isActive" integer not null default 1,
          "validFrom" datetime null,
          "validUntil" datetime null,
          "usageLimit" integer null,
          "usageCount" integer not null default 0
        );
      `);
      this.addSql(
        'create unique index if not exists "promo_codes_code_unique" on "promo_codes" ("code");',
      );
      this.addSql(
        'create index if not exists "promo_codes_is_active_idx" on "promo_codes" ("isActive");',
      );
      return;
    }

    throw new Error(
      `Migration20260512140000: dialect "${client}" chưa được hỗ trợ cho bảng promo_codes.`,
    );
  }

  override down(): void {
    const client = inferDbClient(
      process.env.DATABASE_URL ?? '',
      process.env.DB_CLIENT as SqlClient | undefined,
    );

    if (client === 'postgresql' || client === 'sqlite') {
      this.addSql('drop table if exists "promo_codes";');
      return;
    }

    if (client === 'mysql') {
      this.addSql('drop table if exists `promo_codes`;');
      return;
    }

    throw new Error(
      `Migration20260512140000 (down): dialect "${client}" chưa được hỗ trợ.`,
    );
  }
}
