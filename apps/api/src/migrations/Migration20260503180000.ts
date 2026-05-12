import { Migration } from '@mikro-orm/migrations';

/**
 * Bảo đảm bảng bài viết và pivot (schema lệch — log: Table '….posts' doesn't exist).
 * CREATE IF NOT EXISTS, không FOREIGN KEY / charset cố định (cùng chiến lược 160000/170000).
 *
 * Thứ tự: posts → post_tags, post_categories → comments.
 */
export class Migration20260503180000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`posts\` (
        \`id\` varchar(36) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`content\` json NOT NULL,
        \`excerpt\` varchar(255) NULL,
        \`slug\` varchar(255) NOT NULL,
        \`image\` varchar(255) NULL,
        \`published\` tinyint(1) NOT NULL DEFAULT 0,
        \`publishedAt\` datetime NULL,
        \`eventStartAt\` datetime NULL,
        \`eventEndAt\` datetime NULL,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        \`deletedAt\` datetime NULL,
        \`authorId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`posts_slug_unique\` (\`slug\`),
        KEY \`posts_authorId_index\` (\`authorId\`)
      ) ENGINE = InnoDB;
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`post_tags\` (
        \`postId\` varchar(255) NOT NULL,
        \`tagId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`postId\`, \`tagId\`),
        KEY \`post_tags_postId_index\` (\`postId\`),
        KEY \`post_tags_tagId_index\` (\`tagId\`)
      ) ENGINE = InnoDB;
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`post_categories\` (
        \`postId\` varchar(255) NOT NULL,
        \`categoryId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`postId\`, \`categoryId\`),
        KEY \`post_categories_postId_index\` (\`postId\`),
        KEY \`post_categories_categoryId_index\` (\`categoryId\`)
      ) ENGINE = InnoDB;
    `);

    this.addSql(`
      CREATE TABLE IF NOT EXISTS \`comments\` (
        \`id\` varchar(36) NOT NULL,
        \`content\` text NOT NULL,
        \`approved\` tinyint(1) NOT NULL DEFAULT 0,
        \`createdAt\` datetime NOT NULL,
        \`updatedAt\` datetime NOT NULL,
        \`deletedAt\` datetime NULL,
        \`authorId\` varchar(255) NOT NULL,
        \`postId\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`comments_authorId_index\` (\`authorId\`),
        KEY \`comments_postId_index\` (\`postId\`)
      ) ENGINE = InnoDB;
    `);

    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS `comments`');
    this.addSql('DROP TABLE IF EXISTS `post_categories`');
    this.addSql('DROP TABLE IF EXISTS `post_tags`');
    this.addSql('DROP TABLE IF EXISTS `posts`');
    await Promise.resolve();
  }
}
