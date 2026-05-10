import { Migration } from '@mikro-orm/migrations';

/**
 * Tạo bảng `users` cho DB chỉ có chuỗi migration (migration:fresh).
 * Migration20260508190000 cần `users` để thêm `cartJson`;
 * Migration20260508203000 cần cột legacy `role` (enum) trước khi chuyển sang users_roles.
 */
export class Migration20260508180500 extends Migration {
  override up(): void {
    this.addSql(`
      create table if not exists \`users\` (
        \`id\` int unsigned not null auto_increment,
        \`createdAt\` datetime not null default current_timestamp,
        \`updatedAt\` datetime not null default current_timestamp on update current_timestamp,
        \`email\` varchar(255) not null,
        \`password\` varchar(255) not null,
        \`fullName\` varchar(255) not null,
        \`phone\` varchar(255) null,
        \`address\` text null,
        \`isActive\` tinyint(1) not null default 1,
        \`role\` enum('admin','manager','sales','customer') not null default 'customer',
        primary key (\`id\`),
        unique key \`users_email_unique\` (\`email\`)
      ) default charset=utf8mb4 collate=utf8mb4_unicode_ci;
    `);
  }

  override down(): void {
    this.addSql('drop table if exists `users`');
  }
}
