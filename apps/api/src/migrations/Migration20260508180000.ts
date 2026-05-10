import { Migration } from '@mikro-orm/migrations';

/**
 * Adds the `categories` table when the DB was created before the Category
 * entity existed. `schema:update --safe` can fail on older MySQL rows
 * (e.g. phantom `coupons` constraint diffs on JSON columns), so this migration
 * only runs a guarded CREATE TABLE.
 */
export class Migration20260508180000 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists \`categories\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime not null default current_timestamp,
        \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
        \`name\` varchar(120) not null,
        \`slug\` varchar(120) not null,
        \`description\` text null,
        \`icon\` varchar(60) null,
        \`sortOrder\` int not null default 0,
        \`isActive\` tinyint(1) not null default 1,
        primary key (\`id\`),
        unique key \`categories_slug_unique\` (\`slug\`),
        key \`categories_name_index\` (\`name\`)
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);
  }

  override down(): void {
    this.addSql('drop table if exists `categories`');
  }
}
