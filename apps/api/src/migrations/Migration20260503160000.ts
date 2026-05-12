import { Migration } from '@mikro-orm/migrations';

/**
 * Bảo đảm bảng `user_roles` tồn tại (vd. DB đã migrate bản 140000 cũ trước khi DDL có user_roles).
 * Idempotent: CREATE TABLE IF NOT EXISTS.
 *
 * Không thêm FOREIGN KEY trong migration này: trên MySQL/MariaDB errno 150 thường do
 * charset/collation bảng con (utf8mb4_unicode_ci) không khớp bảng cha (vd. utf8mb4_0900_ai_ci),
 * hoặc schema `users`/`roles` không đồng nhất với migration ban đầu. ORM vẫn hoạt động bình thường;
 * có thể ALTER thêm FK sau khi đã đồng bộ collation (SHOW CREATE TABLE users / roles).
 *
 * Không gán DEFAULT CHARSET/COLLATE — kế thừa mặc định database, tránh lệch với bảng có sẵn.
 *
 * @see https://mikro-orm.io/docs/3.6/migrations — DDL MySQL gây implicit commit, không rollback.
 */
export class Migration20260503160000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`user_roles\` (
        \`id\` varchar(36) NOT NULL,
        \`userId\` varchar(255) NOT NULL,
        \`roleId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`user_roles_userId_roleId_unique\` (\`userId\`, \`roleId\`),
        KEY \`user_roles_userId_index\` (\`userId\`),
        KEY \`user_roles_roleId_index\` (\`roleId\`)
      ) ENGINE = InnoDB;
    `);
    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS `user_roles`');
    await Promise.resolve();
  }
}
