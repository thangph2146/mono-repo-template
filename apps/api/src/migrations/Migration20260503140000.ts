import { Migration } from '@mikro-orm/migrations';

/**
 * Initial MySQL/MariaDB schema — đầy đủ bảng (gồm posts, post_tags, post_categories, comments).
 * Generated from dump-schema-sqlite.ts + build-initial-migration-sql.mjs.
 */
export class Migration20260503140000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table `admission_results` (`id` varchar(36) not null, `cccd` varchar(255) null, `soBaoDanh` varchar(255) null, `hoTen` varchar(255) not null, `nganhDangKy` varchar(255) not null, `diemMon1` varchar(255) null, `diemMon2` varchar(255) null, `diemMon3` varchar(255) null, `diemTong` varchar(255) null, `diemUuTienKhuVuc` varchar(255) null, `diemUuTienDoiTuong` varchar(255) null, `ghiChu` text null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create unique index `admission_results_cccd_unique` on `admission_results` (`cccd`);',
    );
    this.addSql(
      'create unique index `admission_results_soBaoDanh_unique` on `admission_results` (`soBaoDanh`);',
    );
    this.addSql(
      'create table `categories` (`id` varchar(36) not null, `name` varchar(255) not null, `slug` varchar(255) not null, `description` text null, `parentId` varchar(255) null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, constraint `categories_parentId_foreign` foreign key(`parentId`) references `categories`(`id`) on delete set null on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create unique index `categories_name_unique` on `categories` (`name`);',
    );
    this.addSql(
      'create unique index `categories_slug_unique` on `categories` (`slug`);',
    );
    this.addSql(
      'create index `categories_parentId_index` on `categories` (`parentId`);',
    );
    this.addSql(
      'create table `page_contents` (`id` varchar(36) not null, `pageKey` varchar(255) not null, `sectionKey` varchar(255) not null, `content` json not null, `isVisible` tinyint(1) not null default 1, `createdAt` datetime not null, `updatedAt` datetime not null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create unique index `page_contents_pageKey_sectionKey_unique` on `page_contents` (`pageKey`, `sectionKey`);',
    );
    this.addSql(
      'create table `roles` (`id` varchar(36) not null, `name` varchar(255) not null, `displayName` varchar(255) not null, `description` text null, `permissions` json null, `isActive` tinyint(1) not null default 1, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql('create unique index `roles_name_unique` on `roles` (`name`);');
    this.addSql(
      "create table `settings` (`id` varchar(36) not null, `key` varchar(255) not null, `value` json not null, `group` varchar(255) not null default 'general', `createdAt` datetime not null, `updatedAt` datetime not null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;",
    );
    this.addSql(
      'create unique index `settings_key_unique` on `settings` (`key`);',
    );
    this.addSql(
      'create table `tags` (`id` varchar(36) not null, `name` varchar(255) not null, `slug` varchar(255) not null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql('create unique index `tags_name_unique` on `tags` (`name`);');
    this.addSql('create unique index `tags_slug_unique` on `tags` (`slug`);');
    this.addSql(
      'create table `users` (`id` varchar(36) not null, `email` varchar(255) null, `name` varchar(255) null, `password` varchar(255) not null, `bio` text null, `avatar` varchar(255) null, `emailVerified` datetime null, `phone` varchar(255) null, `address` varchar(255) null, `isActive` tinyint(1) not null default 1, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create table `students` (`id` varchar(36) not null, `name` varchar(255) null, `email` varchar(255) null, `studentCode` varchar(255) not null, `isActive` tinyint(1) not null default 1, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `userId` varchar(255) null, constraint `students_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete set null on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create unique index `students_studentCode_unique` on `students` (`studentCode`);',
    );
    this.addSql(
      'create index `students_userId_index` on `students` (`userId`);',
    );
    this.addSql(
      'create table `sessions` (`id` varchar(36) not null, `accessToken` varchar(255) not null, `refreshToken` varchar(255) not null, `userAgent` varchar(255) null, `ipAddress` varchar(255) null, `isActive` tinyint(1) not null default 1, `expiresAt` datetime not null, `lastActivity` datetime not null default current_timestamp, `createdAt` datetime not null, `userId` varchar(255) not null, constraint `sessions_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create unique index `sessions_accessToken_unique` on `sessions` (`accessToken`);',
    );
    this.addSql(
      'create unique index `sessions_refreshToken_unique` on `sessions` (`refreshToken`);',
    );
    this.addSql(
      'create index `sessions_userId_index` on `sessions` (`userId`);',
    );
    this.addSql(
      'create table `posts` (`id` varchar(36) not null, `title` varchar(255) not null, `content` json not null, `excerpt` varchar(255) null, `slug` varchar(255) not null, `image` varchar(255) null, `published` tinyint(1) not null default 0, `publishedAt` datetime null, `eventStartAt` datetime null, `eventEndAt` datetime null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `authorId` varchar(255) not null, constraint `posts_authorId_foreign` foreign key(`authorId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql('create unique index `posts_slug_unique` on `posts` (`slug`);');
    this.addSql('create index `posts_authorId_index` on `posts` (`authorId`);');
    this.addSql(
      'create table `post_tags` (`postId` varchar(255) not null, `tagId` varchar(255) not null, constraint `post_tags_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, constraint `post_tags_tagId_foreign` foreign key(`tagId`) references `tags`(`id`) on delete cascade on update cascade, primary key (`postId`, `tagId`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `post_tags_postId_index` on `post_tags` (`postId`);',
    );
    this.addSql(
      'create index `post_tags_tagId_index` on `post_tags` (`tagId`);',
    );
    this.addSql(
      'create table `post_categories` (`postId` varchar(255) not null, `categoryId` varchar(255) not null, constraint `post_categories_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, constraint `post_categories_categoryId_foreign` foreign key(`categoryId`) references `categories`(`id`) on delete cascade on update cascade, primary key (`postId`, `categoryId`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `post_categories_postId_index` on `post_categories` (`postId`);',
    );
    this.addSql(
      'create index `post_categories_categoryId_index` on `post_categories` (`categoryId`);',
    );
    this.addSql(
      "create table `notifications` (`id` varchar(36) not null, `kind` varchar(255) not null default 'MESSAGE', `title` varchar(255) not null, `description` text null, `isRead` tinyint(1) not null default 0, `actionUrl` varchar(255) null, `metadata` json null, `expiresAt` datetime null, `createdAt` datetime not null, `updatedAt` datetime not null, `readAt` datetime null, `userId` varchar(255) not null, constraint `notifications_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;",
    );
    this.addSql(
      'create index `notifications_userId_index` on `notifications` (`userId`);',
    );
    this.addSql(
      'create index `notifications_kind_index` on `notifications` (`kind`);',
    );
    this.addSql(
      'create index `notifications_userId_createdAt_index` on `notifications` (`userId`, `createdAt`);',
    );
    this.addSql(
      'create index `notifications_userId_isRead_index` on `notifications` (`userId`, `isRead`);',
    );
    this.addSql(
      'create table `groups` (`id` varchar(36) not null, `name` varchar(255) not null, `description` text null, `avatar` varchar(255) null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `createdById` varchar(255) not null, constraint `groups_createdById_foreign` foreign key(`createdById`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `groups_createdById_index` on `groups` (`createdById`);',
    );
    this.addSql(
      "create table `messages` (`id` varchar(36) not null, `subject` varchar(255) not null, `content` text not null, `isRead` tinyint(1) not null default 0, `type` varchar(255) not null default 'NOTIFICATION', `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `parentId` varchar(255) null, `receiverId` varchar(255) null, `senderId` varchar(255) null, `groupId` varchar(255) null, constraint `messages_parentId_foreign` foreign key(`parentId`) references `messages`(`id`) on delete cascade on update cascade, constraint `messages_receiverId_foreign` foreign key(`receiverId`) references `users`(`id`) on delete set null on update cascade, constraint `messages_senderId_foreign` foreign key(`senderId`) references `users`(`id`) on delete set null on update cascade, constraint `messages_groupId_foreign` foreign key(`groupId`) references `groups`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;",
    );
    this.addSql(
      'create index `messages_parentId_index` on `messages` (`parentId`);',
    );
    this.addSql(
      'create index `messages_receiverId_index` on `messages` (`receiverId`);',
    );
    this.addSql(
      'create index `messages_senderId_index` on `messages` (`senderId`);',
    );
    this.addSql(
      'create index `messages_groupId_index` on `messages` (`groupId`);',
    );
    this.addSql(
      'create index `messages_senderId_createdAt_index` on `messages` (`senderId`, `createdAt`);',
    );
    this.addSql(
      'create index `messages_receiverId_createdAt_index` on `messages` (`receiverId`, `createdAt`);',
    );
    this.addSql(
      'create index `messages_groupId_createdAt_index` on `messages` (`groupId`, `createdAt`);',
    );
    this.addSql(
      'create table `message_reads` (`id` varchar(36) not null, `readAt` datetime not null, `messageId` varchar(255) not null, `userId` varchar(255) not null, constraint `message_reads_messageId_foreign` foreign key(`messageId`) references `messages`(`id`) on delete cascade on update cascade, constraint `message_reads_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `message_reads_messageId_index` on `message_reads` (`messageId`);',
    );
    this.addSql(
      'create index `message_reads_userId_index` on `message_reads` (`userId`);',
    );
    this.addSql(
      'create unique index `message_reads_messageId_userId_unique` on `message_reads` (`messageId`, `userId`);',
    );
    this.addSql(
      "create table `group_members` (`id` varchar(36) not null, `role` varchar(255) not null default 'MEMBER', `joinedAt` datetime not null, `leftAt` datetime null, `groupId` varchar(255) not null, `userId` varchar(255) not null, constraint `group_members_groupId_foreign` foreign key(`groupId`) references `groups`(`id`) on delete cascade on update cascade, constraint `group_members_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;",
    );
    this.addSql(
      'create index `group_members_groupId_index` on `group_members` (`groupId`);',
    );
    this.addSql(
      'create index `group_members_userId_index` on `group_members` (`userId`);',
    );
    this.addSql(
      'create unique index `group_members_groupId_userId_unique` on `group_members` (`groupId`, `userId`);',
    );
    this.addSql(
      "create table `contact_requests` (`id` varchar(36) not null, `name` varchar(255) not null, `email` varchar(255) not null, `phone` varchar(255) null, `subject` varchar(255) not null, `content` text not null, `status` varchar(255) not null default 'NEW', `priority` varchar(255) not null default 'MEDIUM', `isRead` tinyint(1) not null default 0, `userId` varchar(255) null, `assignedToId` varchar(255) null, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, constraint `contact_requests_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete set null on update cascade, constraint `contact_requests_assignedToId_foreign` foreign key(`assignedToId`) references `users`(`id`) on delete set null on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;",
    );
    this.addSql(
      'create index `contact_requests_userId_index` on `contact_requests` (`userId`);',
    );
    this.addSql(
      'create index `contact_requests_assignedToId_index` on `contact_requests` (`assignedToId`);',
    );
    this.addSql(
      'create index `contact_requests_isRead_index` on `contact_requests` (`isRead`);',
    );
    this.addSql(
      'create index `contact_requests_priority_index` on `contact_requests` (`priority`);',
    );
    this.addSql(
      'create index `contact_requests_status_index` on `contact_requests` (`status`);',
    );
    this.addSql(
      'create index `contact_requests_userId_createdAt_index` on `contact_requests` (`userId`, `createdAt`);',
    );
    this.addSql(
      'create table `comments` (`id` varchar(36) not null, `content` text not null, `approved` tinyint(1) not null default 0, `createdAt` datetime not null, `updatedAt` datetime not null, `deletedAt` datetime null, `authorId` varchar(255) not null, `postId` varchar(255) not null, constraint `comments_authorId_foreign` foreign key(`authorId`) references `users`(`id`) on delete cascade on update cascade, constraint `comments_postId_foreign` foreign key(`postId`) references `posts`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `comments_authorId_index` on `comments` (`authorId`);',
    );
    this.addSql(
      'create index `comments_postId_index` on `comments` (`postId`);',
    );
    this.addSql(
      'create table `accounts` (`id` varchar(36) not null, `type` varchar(255) not null, `provider` varchar(255) not null, `providerAccountId` varchar(255) not null, `refresh_token` varchar(255) null, `access_token` varchar(255) null, `expires_at` int null, `token_type` varchar(255) null, `scope` varchar(255) null, `id_token` varchar(255) null, `session_state` varchar(255) null, `userId` varchar(255) not null, constraint `accounts_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `accounts_userId_index` on `accounts` (`userId`);',
    );
    this.addSql(
      'create table `user_roles` (`id` varchar(36) not null, `userId` varchar(255) not null, `roleId` varchar(255) not null, constraint `user_roles_userId_foreign` foreign key(`userId`) references `users`(`id`) on delete cascade on update cascade, constraint `user_roles_roleId_foreign` foreign key(`roleId`) references `roles`(`id`) on delete cascade on update cascade, primary key (`id`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    this.addSql(
      'create index `user_roles_userId_index` on `user_roles` (`userId`);',
    );
    this.addSql(
      'create index `user_roles_roleId_index` on `user_roles` (`roleId`);',
    );
    this.addSql(
      'create unique index `user_roles_userId_roleId_unique` on `user_roles` (`userId`, `roleId`);',
    );
    this.addSql(
      'create table `verification_tokens` (`identifier` varchar(255) not null, `token` varchar(255) not null, `expires` datetime not null, primary key (`identifier`, `token`)) default character set utf8mb4 collate utf8mb4_unicode_ci engine = InnoDB;',
    );
    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('SET FOREIGN_KEY_CHECKS = 0');
    this.addSql('DROP TABLE IF EXISTS `verification_tokens`');
    this.addSql('DROP TABLE IF EXISTS `user_roles`');
    this.addSql('DROP TABLE IF EXISTS `accounts`');
    this.addSql('DROP TABLE IF EXISTS `contact_requests`');
    this.addSql('DROP TABLE IF EXISTS `group_members`');
    this.addSql('DROP TABLE IF EXISTS `message_reads`');
    this.addSql('DROP TABLE IF EXISTS `messages`');
    this.addSql('DROP TABLE IF EXISTS `groups`');
    this.addSql('DROP TABLE IF EXISTS `notifications`');
    this.addSql('DROP TABLE IF EXISTS `sessions`');
    this.addSql('DROP TABLE IF EXISTS `students`');
    this.addSql('DROP TABLE IF EXISTS `comments`');
    this.addSql('DROP TABLE IF EXISTS `post_tags`');
    this.addSql('DROP TABLE IF EXISTS `post_categories`');
    this.addSql('DROP TABLE IF EXISTS `posts`');
    this.addSql('DROP TABLE IF EXISTS `users`');
    this.addSql('DROP TABLE IF EXISTS `categories`');
    this.addSql('DROP TABLE IF EXISTS `tags`');
    this.addSql('DROP TABLE IF EXISTS `settings`');
    this.addSql('DROP TABLE IF EXISTS `roles`');
    this.addSql('DROP TABLE IF EXISTS `page_contents`');
    this.addSql('DROP TABLE IF EXISTS `admission_results`');
    this.addSql('SET FOREIGN_KEY_CHECKS = 1');
    await Promise.resolve();
  }
}
