import { Migration } from '@mikro-orm/migrations';

/**
 * Bảo đảm các bảng còn thiếu trên DB lệch schema (seed/full-export cần).
 * CREATE IF NOT EXISTS, không FOREIGN KEY / charset cố định — tránh errno 150.
 *
 * Bảng: contact_requests, notifications, sessions (đủ cho luồng seed sau postTag).
 */
export class Migration20260503170000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`contact_requests\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`phone\` varchar(255) NULL,
        \`subject\` varchar(255) NOT NULL,
        \`content\` text NOT NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'NEW',
        \`priority\` varchar(255) NOT NULL DEFAULT 'MEDIUM',
        \`isRead\` tinyint(1) NOT NULL DEFAULT 0,
        \`userId\` varchar(255) NULL,
        \`assignedToId\` varchar(255) NULL,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        \`deletedAt\` datetime NULL,
        PRIMARY KEY (\`id\`),
        KEY \`contact_requests_userId_index\` (\`userId\`),
        KEY \`contact_requests_assignedToId_index\` (\`assignedToId\`),
        KEY \`contact_requests_isRead_index\` (\`isRead\`),
        KEY \`contact_requests_priority_index\` (\`priority\`),
        KEY \`contact_requests_status_index\` (\`status\`),
        KEY \`contact_requests_userId_createdAt_index\` (\`userId\`, \`createdAt\`)
      ) ENGINE = InnoDB;
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` varchar(36) NOT NULL,
        \`kind\` varchar(255) NOT NULL DEFAULT 'MESSAGE',
        \`title\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`isRead\` tinyint(1) NOT NULL DEFAULT 0,
        \`actionUrl\` varchar(255) NULL,
        \`metadata\` json NULL,
        \`expiresAt\` datetime NULL,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        \`readAt\` datetime NULL,
        \`userId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`notifications_userId_index\` (\`userId\`),
        KEY \`notifications_kind_index\` (\`kind\`),
        KEY \`notifications_userId_createdAt_index\` (\`userId\`, \`createdAt\`),
        KEY \`notifications_userId_isRead_index\` (\`userId\`, \`isRead\`)
      ) ENGINE = InnoDB;
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`accessToken\` varchar(255) NOT NULL,
        \`refreshToken\` varchar(255) NOT NULL,
        \`userAgent\` varchar(255) NULL,
        \`ipAddress\` varchar(255) NULL,
        \`isActive\` tinyint(1) NOT NULL DEFAULT 1,
        \`expiresAt\` datetime NOT NULL,
        \`lastActivity\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` datetime NOT NULL,
        \`userId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`sessions_accessToken_unique\` (\`accessToken\`),
        UNIQUE KEY \`sessions_refreshToken_unique\` (\`refreshToken\`),
        KEY \`sessions_userId_index\` (\`userId\`)
      ) ENGINE = InnoDB;
    `);

    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS `notifications`');
    this.addSql('DROP TABLE IF EXISTS `sessions`');
    this.addSql('DROP TABLE IF EXISTS `contact_requests`');
    await Promise.resolve();
  }
}
