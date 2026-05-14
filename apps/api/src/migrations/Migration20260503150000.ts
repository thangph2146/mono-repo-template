import { Migration } from '@mikro-orm/migrations';

/**
 * Bổ sung bảng post khi DB đã ghi nhận Migration20260503140000 nhưng thực tế thiếu
 * posts / post_tags / post_categories / comments (vd. initial đã chạy bản DDL cũ).
 * Chỉ chạy khi các bảng này chưa tồn tại; nếu đã có đủ thì bỏ qua migration này (không commit file / xóa khỏi pending).
 */
export class Migration20260503150000 extends Migration {
  private async tableExists(tableName: string): Promise<boolean> {
    const rows = (await this.execute(
      `select 1 as ok from information_schema.tables where table_schema = database() and table_name = ? limit 1`,
      [tableName],
    )) as Array<{ ok?: number }>;
    return rows.length > 0;
  }

  async up(): Promise<void> {
    if (!(await this.tableExists('posts'))) {
      this.addSql(
        'create table `posts` (`id` varchar(36) not null, `title` varchar(255) not null, `content` json not null, `excerpt` varchar(255) null, `slug` varchar(255) not null, `image` varchar(255) null, `published` tinyint(1) not null default 0, `publishedAt` datetime null, `eventStartAt` datetime null, `eventEndAt` datetime null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `authorId` varchar(255) not null, constraint `posts_authorId_foreign` foreign key(`authorId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
      );
      this.addSql(
        'create unique index `posts_slug_unique` on `posts` (`slug`);',
      );
      this.addSql(
        'create index `posts_authorId_index` on `posts` (`authorId`);',
      );
    }

    if (!(await this.tableExists('post_tags'))) {
      this.addSql(
        'create table `post_tags` (`postId` varchar(255) not null, `tagId` varchar(255) not null, constraint `post_tags_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, constraint `post_tags_tagId_foreign` foreign key(`tagId`) references `tags`(`id`) on delete cascade on update cascade, primary key (`postId`, `tagId`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
      );
      this.addSql(
        'create index `post_tags_postId_index` on `post_tags` (`postId`);',
      );
      this.addSql(
        'create index `post_tags_tagId_index` on `post_tags` (`tagId`);',
      );
    }

    if (!(await this.tableExists('post_categories'))) {
      this.addSql(
        'create table `post_categories` (`postId` varchar(255) not null, `categoryId` varchar(255) not null, constraint `post_categories_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, constraint `post_categories_categoryId_foreign` foreign key(`categoryId`) references `categories`(`id`) on delete cascade on update cascade, primary key (`postId`, `categoryId`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
      );
      this.addSql(
        'create index `post_categories_postId_index` on `post_categories` (`postId`);',
      );
      this.addSql(
        'create index `post_categories_categoryId_index` on `post_categories` (`categoryId`);',
      );
    }

    if (!(await this.tableExists('comments'))) {
      this.addSql(
        'create table `comments` (`id` varchar(36) not null, `content` text not null, `approved` tinyint(1) not null default 0, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `authorId` varchar(255) not null, `postId` varchar(255) not null, constraint `comments_authorId_foreign` foreign key(`authorId`) references `users`(`id`) on delete cascade on update cascade, constraint `comments_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
      );
      this.addSql(
        'create index `comments_authorId_index` on `comments` (`authorId`);',
      );
      this.addSql(
        'create index `comments_postId_index` on `comments` (`postId`);',
      );
    }

    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('SET FOREIGN_KEY_CHECKS = 0');
    this.addSql('DROP TABLE IF EXISTS `comments`');
    this.addSql('DROP TABLE IF EXISTS `post_categories`');
    this.addSql('DROP TABLE IF EXISTS `post_tags`');
    this.addSql('DROP TABLE IF EXISTS `posts`');
    this.addSql('SET FOREIGN_KEY_CHECKS = 1');
    await Promise.resolve();
  }
}
