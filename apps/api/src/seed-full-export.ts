import 'reflect-metadata';
import { config } from 'dotenv';
import {
  MikroORM,
  EntityCaseNamingStrategy,
  type EntityManager,
} from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MySqlDriver } from '@mikro-orm/mysql';
import * as fs from 'fs';
import * as path from 'path';
import { ormEntities } from './mikro-orm/orm-entities';
import { Account } from './entities/account.entity';
import { AdmissionResult } from './entities/admission-result.entity';
import { Category } from './entities/category.entity';
import { Comment } from './entities/comment.entity';
import { ContactRequest } from './entities/contact-request.entity';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';
import { Notification, NotificationKind } from './entities/notification.entity';
import { PageContent } from './entities/page-content.entity';
import { Post } from './entities/post.entity';
import { PostCategory } from './entities/post-category.entity';
import { PostTag } from './entities/post-tag.entity';
import { Role } from './entities/role.entity';
import { Session } from './entities/session.entity';
import { Setting } from './entities/setting.entity';
import { Student } from './entities/student.entity';
import { Tag } from './entities/tag.entity';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { VerificationToken } from './entities/verification-token.entity';
import {
  orderCategoryRowsForImport,
  sanitizePivotRowsInExportJson,
  stripHeroSlidesPermissions,
  stripLegacyHeroSlideFromBundle,
} from './system/import-helpers';

config();

type ExportRow = Record<string, unknown>;
type ExportBundle = Record<string, ExportRow[] | undefined>;

const ISO_DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'emailVerified',
  'publishedAt',
  'eventStartAt',
  'eventEndAt',
  'expiresAt',
  'lastActivity',
  'readAt',
  'joinedAt',
  'leftAt',
  'expires',
]);

function getDriver() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres')) return PostgreSqlDriver;
  if (dbUrl.startsWith('sqlite')) return SqliteDriver;
  return MySqlDriver;
}

function sqlDialect(): 'postgres' | 'sqlite' | 'mysql' {
  const u = process.env.DATABASE_URL || '';
  if (u.startsWith('postgres')) return 'postgres';
  if (u.startsWith('sqlite')) return 'sqlite';
  return 'mysql';
}

/**
 * Bảng pivot PostCategory / PostTag: persist entity dễ lỗi (validate bắt buộc relation,
 * hoặc INSERT trùng cột). Chèn trực tiếp qua connection.
 */
async function insertPostCategoryPivot(
  tx: EntityManager,
  postId: string,
  categoryId: string,
): Promise<void> {
  const d = sqlDialect();
  if (d === 'postgres') {
    await tx.getConnection().execute(
      `insert into "post_categories" ("postId", "categoryId") values (?, ?)
       on conflict ("postId", "categoryId") do nothing`,
      [postId, categoryId],
    );
  } else if (d === 'sqlite') {
    await tx
      .getConnection()
      .execute(
        'insert or ignore into `post_categories` (`postId`, `categoryId`) values (?, ?)',
        [postId, categoryId],
      );
  } else {
    await tx
      .getConnection()
      .execute(
        'insert ignore into `post_categories` (`postId`, `categoryId`) values (?, ?)',
        [postId, categoryId],
      );
  }
}

async function insertPostTagPivot(
  tx: EntityManager,
  postId: string,
  tagId: string,
): Promise<void> {
  const d = sqlDialect();
  if (d === 'postgres') {
    await tx.getConnection().execute(
      `insert into "post_tags" ("postId", "tagId") values (?, ?)
       on conflict ("postId", "tagId") do nothing`,
      [postId, tagId],
    );
  } else if (d === 'sqlite') {
    await tx
      .getConnection()
      .execute(
        'insert or ignore into `post_tags` (`postId`, `tagId`) values (?, ?)',
        [postId, tagId],
      );
  } else {
    await tx
      .getConnection()
      .execute(
        'insert ignore into `post_tags` (`postId`, `tagId`) values (?, ?)',
        [postId, tagId],
      );
  }
}

function resolveExportPath(): string {
  const fromEnv = process.env.SEED_EXPORT_PATH?.trim();
  const fromArg = process.argv[2]?.trim();
  const fallback = path.join(__dirname, 'full-export-2026-05-14.json');
  const p = fromEnv || fromArg || fallback;
  if (!fs.existsSync(p)) {
    throw new Error(`Không tìm thấy file export: ${p}`);
  }
  return p;
}

function loadExport(filePath: string): ExportBundle {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ExportBundle;
  const { droppedPostCategory, droppedPostTag } = sanitizePivotRowsInExportJson(
    raw as Record<string, unknown>,
  );
  if (droppedPostCategory > 0 || droppedPostTag > 0) {
    console.warn(
      `[seed-full-export] File lệch pivot: bỏ ${droppedPostCategory} postCategory, ${droppedPostTag} postTag (post|category|tag không có trong file).`,
    );
  }
  const droppedHero = stripLegacyHeroSlideFromBundle(
    raw as Record<string, unknown>,
  );
  if (droppedHero > 0) {
    console.log(
      `[seed-full-export] Đã bỏ key heroSlide (${droppedHero} bản ghi — không còn bảng).`,
    );
  }
  return raw;
}

function coerceRowDates(row: ExportRow): void {
  for (const k of Object.keys(row)) {
    if (!ISO_DATE_FIELDS.has(k)) continue;
    const v = row[k];
    if (typeof v === 'string') row[k] = new Date(v);
  }
}

/** Thứ tự phụ thuộc FK — giống logic import bulk trong hệ thống. */
const SEED_MODEL_ORDER = [
  'role',
  'user',
  'category',
  'tag',
  'setting',
  'admissionResult',
  'post',
  'postCategory',
  'postTag',
  'comment',
  'contactRequest',
  'group',
  'groupMember',
  'message',
  'messageRead',
  'notification',
  'pageContent',
  'userRole',
  'account',
  'session',
  'student',
  'verificationToken',
] as const;

function orderMessages(rows: ExportRow[]): ExportRow[] {
  const pool = new Map<string, ExportRow>(
    rows.map((r) => [String(r.id), { ...r }]),
  );
  const result: ExportRow[] = [];
  const inserted = new Set<string>();
  let guard = 0;
  while (pool.size && guard++ < rows.length + 10) {
    let added = 0;
    for (const [id, row] of [...pool.entries()]) {
      const p = row.parentId as string | null | undefined;
      if (!p || inserted.has(p)) {
        result.push(row);
        inserted.add(id);
        pool.delete(id);
        added++;
      }
    }
    if (added === 0) break;
  }
  for (const row of pool.values()) {
    row.parentId = null;
    result.push(row);
  }
  return result;
}

async function seedFromExport(orm: MikroORM, data: ExportBundle) {
  const em = orm.em.fork();

  console.log(
    '[seed-full-export] Một transaction duy nhất: lỗi ở bước sau sẽ rollback toàn bộ (role/user/… chưa commit ra DB nếu seed chưa chạy xong).',
  );

  await em.transactional(async (tx) => {
    for (const key of SEED_MODEL_ORDER) {
      const rows = data[key];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      console.log(`[seed-full-export] ${key}: ${rows.length} bản ghi…`);

      switch (key) {
        case 'role': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Role, { id })) continue;
            const e = new Role();
            e.id = id;
            e.name = raw.name as string;
            e.displayName = raw.displayName as string;
            e.description = (raw.description as string | null) ?? null;
            e.permissions = stripHeroSlidesPermissions(raw.permissions);
            e.isActive = Boolean(raw.isActive ?? true);
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'user': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(User, { id })) continue;
            const e = new User();
            e.id = id;
            e.email = (raw.email as string | null) ?? null;
            e.name = (raw.name as string | null) ?? null;
            e.password = raw.password as string;
            e.bio = (raw.bio as string | null) ?? null;
            e.avatar = (raw.avatar as string | null) ?? null;
            e.emailVerified = (raw.emailVerified as Date | null) ?? null;
            e.phone = (raw.phone as string | null) ?? null;
            e.address = (raw.address as string | null) ?? null;
            e.isActive = Boolean(raw.isActive ?? true);
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'category': {
          for (const raw of orderCategoryRowsForImport(rows)) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Category, { id })) continue;
            const e = new Category();
            e.id = id;
            e.name = raw.name as string;
            e.slug = raw.slug as string;
            e.description = (raw.description as string | null) ?? null;
            const pid = raw.parentId as string | null | undefined;
            e.parent = pid ? tx.getReference(Category, pid) : null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'tag': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Tag, { id })) continue;
            const e = new Tag();
            e.id = id;
            e.name = raw.name as string;
            e.slug = raw.slug as string;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'setting': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Setting, { id })) continue;
            const e = new Setting();
            e.id = id;
            e.key = raw.key as string;
            e.value = raw.value;
            e.group = (raw.group as string) ?? 'general';
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            tx.persist(e);
          }
          break;
        }
        case 'admissionResult': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(AdmissionResult, { id })) continue;
            const e = new AdmissionResult();
            e.id = id;
            e.cccd = (raw.cccd as string | null) ?? null;
            e.soBaoDanh = (raw.soBaoDanh as string | null) ?? null;
            e.hoTen = raw.hoTen as string;
            e.nganhDangKy = raw.nganhDangKy as string;
            e.diemMon1 = (raw.diemMon1 as string | null) ?? null;
            e.diemMon2 = (raw.diemMon2 as string | null) ?? null;
            e.diemMon3 = (raw.diemMon3 as string | null) ?? null;
            e.diemTong = (raw.diemTong as string | null) ?? null;
            e.diemUuTienKhuVuc =
              (raw.diemUuTienKhuVuc as string | null) ?? null;
            e.diemUuTienDoiTuong =
              (raw.diemUuTienDoiTuong as string | null) ?? null;
            e.ghiChu = (raw.ghiChu as string | null) ?? null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'post': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Post, { id })) continue;
            const e = new Post();
            e.id = id;
            e.title = raw.title as string;
            e.content = raw.content;
            e.excerpt = (raw.excerpt as string | null) ?? null;
            e.slug = raw.slug as string;
            e.image = (raw.image as string | null) ?? null;
            e.published = Boolean(raw.published);
            e.publishedAt = (raw.publishedAt as Date | null) ?? null;
            e.eventStartAt = (raw.eventStartAt as Date | null) ?? null;
            e.eventEndAt = (raw.eventEndAt as Date | null) ?? null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            e.author = tx.getReference(User, String(raw.authorId));
            tx.persist(e);
          }
          break;
        }
        case 'postCategory': {
          for (const raw of rows) {
            const postId = String(raw.postId);
            const categoryId = String(raw.categoryId);
            const exists = await tx.findOne(PostCategory, {
              post: postId,
              category: categoryId,
            });
            if (exists) continue;
            await insertPostCategoryPivot(tx, postId, categoryId);
          }
          break;
        }
        case 'postTag': {
          for (const raw of rows) {
            const postId = String(raw.postId);
            const tagId = String(raw.tagId);
            const exists = await tx.findOne(PostTag, {
              post: postId,
              tag: tagId,
            });
            if (exists) continue;
            await insertPostTagPivot(tx, postId, tagId);
          }
          break;
        }
        case 'comment': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Comment, { id })) continue;
            const e = new Comment();
            e.id = id;
            e.content = raw.content as string;
            e.approved = Boolean(raw.approved);
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            e.author = tx.getReference(User, String(raw.authorId));
            e.post = tx.getReference(Post, String(raw.postId));
            tx.persist(e);
          }
          break;
        }
        case 'contactRequest': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(ContactRequest, { id })) continue;
            const e = new ContactRequest();
            e.id = id;
            e.name = raw.name as string;
            e.email = raw.email as string;
            e.phone = (raw.phone as string | null) ?? null;
            e.subject = raw.subject as string;
            e.content = raw.content as string;
            e.status = raw.status as ContactRequest['status'];
            e.priority = raw.priority as ContactRequest['priority'];
            e.isRead = Boolean(raw.isRead);
            const uid = raw.userId as string | null | undefined;
            e.submittedBy = uid ? tx.getReference(User, uid) : null;
            const aid = raw.assignedToId as string | null | undefined;
            e.assignedTo = aid ? tx.getReference(User, aid) : null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            tx.persist(e);
          }
          break;
        }
        case 'group': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Group, { id })) continue;
            const e = new Group();
            e.id = id;
            e.name = raw.name as string;
            e.description = (raw.description as string | null) ?? null;
            e.avatar = (raw.avatar as string | null) ?? null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            e.creator = tx.getReference(
              User,
              String(raw.createdById ?? raw.creatorId),
            );
            tx.persist(e);
          }
          break;
        }
        case 'groupMember': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(GroupMember, { id })) continue;
            const e = new GroupMember();
            e.id = id;
            e.role = raw.role as GroupMember['role'];
            e.joinedAt = raw.joinedAt as Date;
            e.leftAt = (raw.leftAt as Date | null) ?? null;
            e.group = tx.getReference(Group, String(raw.groupId));
            e.user = tx.getReference(User, String(raw.userId));
            tx.persist(e);
          }
          break;
        }
        case 'message': {
          for (const raw of orderMessages(rows)) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Message, { id })) continue;
            const e = new Message();
            e.id = id;
            e.subject = raw.subject as string;
            e.content = raw.content as string;
            e.isRead = Boolean(raw.isRead);
            e.type = raw.type as Message['type'];
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            const pid = raw.parentId as string | null | undefined;
            e.parent = pid ? tx.getReference(Message, pid) : null;
            const rid = raw.receiverId as string | null | undefined;
            e.receiver = rid ? tx.getReference(User, rid) : null;
            const sid = raw.senderId as string | null | undefined;
            e.sender = sid ? tx.getReference(User, sid) : null;
            const gid = raw.groupId as string | null | undefined;
            e.group = gid ? tx.getReference(Group, gid) : null;
            tx.persist(e);
          }
          break;
        }
        case 'messageRead': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(MessageRead, { id })) continue;
            const e = new MessageRead();
            e.id = id;
            e.readAt = raw.readAt as Date;
            e.message = tx.getReference(Message, String(raw.messageId));
            e.user = tx.getReference(User, String(raw.userId));
            tx.persist(e);
          }
          break;
        }
        case 'notification': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Notification, { id })) continue;
            const e = new Notification();
            e.id = id;
            e.kind = (raw.kind as NotificationKind) ?? NotificationKind.MESSAGE;
            e.title = raw.title as string;
            e.description = (raw.description as string | null) ?? null;
            e.isRead = Boolean(raw.isRead);
            e.actionUrl = (raw.actionUrl as string | null) ?? null;
            e.metadata =
              (raw.metadata as Record<string, unknown> | null) ?? null;
            e.expiresAt = (raw.expiresAt as Date | null) ?? null;
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.readAt = (raw.readAt as Date | null) ?? null;
            e.user = tx.getReference(User, String(raw.userId));
            tx.persist(e);
          }
          break;
        }
        case 'pageContent': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(PageContent, { id })) continue;
            const e = new PageContent();
            e.id = id;
            e.pageKey = raw.pageKey as string;
            e.sectionKey = raw.sectionKey as string;
            e.content =
              (raw.content as Record<string, unknown>) &&
              typeof raw.content === 'object'
                ? (raw.content as Record<string, unknown>)
                : {};
            e.isVisible = Boolean(raw.isVisible ?? true);
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            tx.persist(e);
          }
          break;
        }
        case 'userRole': {
          for (const raw of rows) {
            const id = String(raw.id);
            if (await tx.findOne(UserRole, { id })) continue;
            const e = new UserRole();
            e.id = id;
            e.user = tx.getReference(User, String(raw.userId));
            e.role = tx.getReference(Role, String(raw.roleId));
            tx.persist(e);
          }
          break;
        }
        case 'account': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Account, { id })) continue;
            const e = new Account();
            e.id = id;
            e.type = raw.type as string;
            e.provider = raw.provider as string;
            e.providerAccountId = raw.providerAccountId as string;
            e.refresh_token = (raw.refresh_token as string | null) ?? undefined;
            e.access_token = (raw.access_token as string | null) ?? undefined;
            e.expires_at =
              raw.expires_at == null ? undefined : Number(raw.expires_at);
            e.token_type = (raw.token_type as string | null) ?? undefined;
            e.scope = (raw.scope as string | null) ?? undefined;
            e.id_token = (raw.id_token as string | null) ?? undefined;
            e.session_state = (raw.session_state as string | null) ?? undefined;
            e.user = tx.getReference(User, String(raw.userId));
            tx.persist(e);
          }
          break;
        }
        case 'session': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Session, { id })) continue;
            const e = new Session();
            e.id = id;
            e.accessToken = raw.accessToken as string;
            e.refreshToken = raw.refreshToken as string;
            e.userAgent = (raw.userAgent as string | null) ?? null;
            e.ipAddress = (raw.ipAddress as string | null) ?? null;
            e.isActive = Boolean(raw.isActive ?? true);
            e.expiresAt = raw.expiresAt as Date;
            e.lastActivity = raw.lastActivity as Date;
            e.createdAt = raw.createdAt as Date;
            e.user = tx.getReference(User, String(raw.userId));
            tx.persist(e);
          }
          break;
        }
        case 'student': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const id = String(raw.id);
            if (await tx.findOne(Student, { id })) continue;
            const e = new Student();
            e.id = id;
            e.name = (raw.name as string | null) ?? null;
            e.email = (raw.email as string | null) ?? null;
            e.studentCode = raw.studentCode as string;
            e.isActive = Boolean(raw.isActive ?? true);
            e.createdAt = raw.createdAt as Date;
            e.updatedAt = raw.updatedAt as Date;
            e.deletedAt = (raw.deletedAt as Date | null) ?? null;
            const uid = raw.userId as string | null | undefined;
            e.user = uid ? tx.getReference(User, uid) : null;
            tx.persist(e);
          }
          break;
        }
        case 'verificationToken': {
          for (const raw of rows) {
            coerceRowDates(raw);
            const identifier = String(raw.identifier);
            const token = String(raw.token);
            const exists = await tx.findOne(VerificationToken, {
              identifier,
              token,
            });
            if (exists) continue;
            const e = new VerificationToken();
            e.identifier = identifier;
            e.token = token;
            e.expires = raw.expires as Date;
            tx.persist(e);
          }
          break;
        }
        default:
          break;
      }

      await tx.flush();
    }
  });

  console.log('[seed-full-export] Hoàn tất.');
}

async function main() {
  const exportPath = resolveExportPath();
  console.log(`[seed-full-export] Đọc: ${exportPath}`);
  const data = loadExport(exportPath);

  const orm = await MikroORM.init({
    driver: getDriver() as never,
    clientUrl: process.env.DATABASE_URL,
    entities: [...ormEntities],
    namingStrategy: EntityCaseNamingStrategy,
    debug: false,
  });

  try {
    await seedFromExport(orm, data);
  } finally {
    await orm.close();
  }
}

main().catch((err) => {
  console.error('[seed-full-export] Lỗi:', err);
  process.exit(1);
});
