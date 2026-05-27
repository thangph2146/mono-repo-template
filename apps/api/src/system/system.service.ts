import { Injectable, Logger } from '@nestjs/common';
import {
  EntityManager,
  type EntityName,
  type EntityProperty,
  serialize,
  wrap,
} from '@mikro-orm/core';
import { hashSync } from 'bcryptjs';
import * as ExcelJS from 'exceljs';

import { Account } from '../entities/account.entity';
import { AdmissionResult } from '../entities/admission-result.entity';
import { Category } from '../entities/category.entity';
import { Comment } from '../entities/comment.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Group } from '../entities/group.entity';
import { MessageRead } from '../entities/message-read.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { PageContent } from '../entities/page-content.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import { PostCategory } from '../entities/post-category.entity';
import { PostTag } from '../entities/post-tag.entity';
import { Post } from '../entities/post.entity';
import { Role } from '../entities/role.entity';
import { Session } from '../entities/session.entity';
import { Setting } from '../entities/setting.entity';
import { Student } from '../entities/student.entity';
import { Tag } from '../entities/tag.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { VerificationToken } from '../entities/verification-token.entity';
import { ormEntities } from '../mikro-orm/orm-entities';
import {
  runSuperadminBootstrap,
  ensureSeedUserRoleLinks,
} from '../seeds/superadmin-bootstrap.runner';
import type { SuperadminBootstrapResult } from '../seeds/superadmin-bootstrap.runner';
import {
  orderCategoryRowsForImport,
  sanitizePivotRowsInExportJson,
  stripHeroSlidesPermissions,
  stripLegacyHeroSlideFromBundle,
} from './import-helpers';

const EXCEL_META_SHEET = '__meta';
const EXCEL_NULL_MARKER = '__HUB_NULL__';
const EXCEL_MAX_CELL_CHARS = 32767;
type ExcelWorkbookLoadInput = Parameters<ExcelJS.Workbook['xlsx']['load']>[0];

/** Xoá ký tự điều khiển XML (0x00–0x08, 0x0B–0x0C, 0x0E–0x1F) có thể làm hỏng XLSX. */
function sanitizeExcelString(raw: string): string {
  if (!raw) return raw;
  const re = new RegExp(
    '[\x00-\x08\x0B\x0C\x0E-\x1F]', // eslint-disable-line no-control-regex
    'g',
  );
  return raw.replace(re, '');
}

/** bcrypt — chỉ khi bản ghi user thiếu password trong JSON export. */
let importUserFallbackPasswordHash: string | null = null;
function getImportUserFallbackPasswordHash(): string {
  if (!importUserFallbackPasswordHash) {
    const plain =
      process.env.IMPORT_FALLBACK_PASSWORD_PLAIN?.trim() ||
      'ImportFallback#2026';
    importUserFallbackPasswordHash = hashSync(plain, 10);
  }
  return importUserFallbackPasswordHash;
}

const entityByModelName: Record<string, EntityName<any>> = {
  admissionResult: AdmissionResult,
  verificationToken: VerificationToken,
  pageContent: PageContent,
  setting: Setting,
  messageRead: MessageRead,
  groupMember: GroupMember,
  postCategory: PostCategory,
  postTag: PostTag,
  comment: Comment,
  notification: Notification,
  contactRequest: ContactRequest,
  account: Account,
  session: Session,
  userRole: UserRole,
  parentStudent: ParentStudent,
  message: Message,
  post: Post,
  student: Student,
  category: Category,
  tag: Tag,
  group: Group,
  user: User,
  role: Role,
};

/** Khớp tên model export (`postCategory`) với tên class entity (`PostCategory`). */
function entityClassToExportModelName(entity: EntityName<any>): string {
  const name =
    typeof entity === 'function'
      ? (entity as { name: string }).name
      : typeof entity === 'string'
        ? entity
        : String(entity as unknown as string);
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}

/** Bỏ qua quan hệ không map trực tiếp ra cột (MikroORM v6: `EntityProperty.reference`). */
function shouldSkipImportProperty(prop: EntityProperty): boolean {
  if (prop.persist === false) return true;
  const kind = String((prop as { kind?: unknown }).kind ?? '');
  if (kind === '1:m' || kind === 'm:n') {
    return true;
  }
  if (kind === '1:1' && prop.mappedBy) {
    return true;
  }
  return false;
}

const IMPORT_DATE_SCALAR_PROP_NAMES = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'readAt',
  'expiresAt',
  'lastActivity',
  'emailVerified',
]);

/** Cột date/time trên MySQL không chấp nhận literal ISO (`...T...Z`); cần Date để driver format đúng. */
function isTemporalColumn(prop: EntityProperty): boolean {
  const col = prop.columnTypes?.[0]?.toLowerCase() ?? '';
  if (
    col === 'date' ||
    col === 'datetime' ||
    col === 'timestamp' ||
    col === 'time' ||
    col === 'timestamptz' ||
    col.includes('datetime') ||
    col.includes('timestamp')
  ) {
    return true;
  }
  const t = String(prop.type ?? '').toLowerCase();
  if (t.includes('date') || t.includes('time')) {
    return true;
  }
  return IMPORT_DATE_SCALAR_PROP_NAMES.has(prop.name);
}

function normalizeImportScalar(prop: EntityProperty, raw: unknown): unknown {
  if (raw === null) return null;
  if (!isTemporalColumn(prop)) return raw;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d;
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return raw;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? raw : d;
  }
  return raw;
}

/**
 * Post / PageContent: `content` là JSON object (Lexical…). Export đôi khi là chuỗi;
 * insertMany + driver lỗi nếu không parse — đồng bộ với seed-full-export.
 */
function normalizeContentJsonForImport(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return {};
    try {
      const parsed = JSON.parse(s) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

/** MySQL JSON + insertMany đôi khi lỗi với object phức tạp — ép plain object qua JSON. */
function plainJsonRecord(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function coerceImportDate(val: unknown, fallback: Date): Date {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
}

function encodeExcelCellValue(value: unknown): string | number | boolean {
  if (value === null) return EXCEL_NULL_MARKER;
  if (value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string')
    return sanitizeExcelString(value).slice(0, EXCEL_MAX_CELL_CHARS);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
    return EXCEL_NULL_MARKER;
  }
  try {
    const str = JSON.stringify(value);
    return sanitizeExcelString(str).slice(0, EXCEL_MAX_CELL_CHARS);
  } catch {
    return EXCEL_NULL_MARKER;
  }
}

function parseExcelObjectValue(value: object): unknown {
  if ('result' in value) {
    return parseExcelCellValue((value as { result?: unknown }).result);
  }
  if ('text' in value) {
    return String((value as { text?: unknown }).text ?? '');
  }
  if ('richText' in value) {
    return ((value as { richText?: Array<{ text?: string }> }).richText ?? [])
      .map((item) => item.text ?? '')
      .join('');
  }
  return String(value);
}

function parseExcelCellValue(value: unknown): unknown {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'object') {
    return parseExcelObjectValue(value);
  }
  if (typeof value !== 'string') {
    return value;
  }
  if (value === EXCEL_NULL_MARKER) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  private readonly modelOrder = [
    'admissionResult',
    'verificationToken',
    'pageContent',
    'setting',
    'messageRead',
    'groupMember',
    'postCategory',
    'postTag',
    'comment',
    'notification',
    'contactRequest',
    'account',
    'session',
    'userRole',
    'parentStudent',
    'message',
    'post',
    'student',
    'category',
    'tag',
    'group',
    'user',
    'role',
  ];

  constructor(private readonly em: EntityManager) {
    this.assertExportRegistryCoversOrmEntities();
  }

  private getWorkbookSheetName(modelName: string): string {
    return modelName.slice(0, 31);
  }

  private getDefaultExcelColumns(modelName: string): string[] {
    if (modelName === 'postCategory') return ['postId', 'categoryId'];
    if (modelName === 'postTag') return ['postId', 'tagId'];

    const entity = entityByModelName[modelName];
    if (!entity) return [];
    const entityName =
      typeof entity === 'string'
        ? entity
        : typeof entity === 'function'
          ? entity.name
          : String(entity as unknown as string);
    const meta = this.em.getMetadata().find(entityName);
    if (!meta) return [];

    return Object.values(meta.properties)
      .filter((prop) => !shouldSkipImportProperty(prop))
      .map((prop) => prop.name);
  }

  private getExcelColumns(
    modelName: string,
    rows: Record<string, unknown>[],
  ): string[] {
    const columns = [...this.getDefaultExcelColumns(modelName)];
    const seen = new Set(columns);

    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (seen.has(key)) continue;
        seen.add(key);
        columns.push(key);
      }
    }

    return columns;
  }

  private addWorkbookMetadataSheet(
    workbook: ExcelJS.Workbook,
    data: Record<string, any[]>,
  ): void {
    const sheet = workbook.addWorksheet(EXCEL_META_SHEET, {
      state: 'veryHidden',
    });
    sheet.columns = [
      { header: 'modelName', key: 'modelName', width: 24 },
      { header: 'sheetName', key: 'sheetName', width: 24 },
      { header: 'rowCount', key: 'rowCount', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    for (const [modelName, rows] of Object.entries(data)) {
      sheet.addRow({
        modelName,
        sheetName: this.getWorkbookSheetName(modelName),
        rowCount: rows.length,
      });
    }
  }

  async exportExcelData(modelName?: string): Promise<Buffer> {
    const data = (await this.exportData(modelName)) as Record<
      string,
      Record<string, unknown>[]
    >;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HUB API';
    workbook.created = new Date();
    workbook.modified = new Date();

    this.addWorkbookMetadataSheet(workbook, data);

    for (const [currentModelName, rows] of Object.entries(data)) {
      const sheet = workbook.addWorksheet(
        this.getWorkbookSheetName(currentModelName),
      );
      const columns = this.getExcelColumns(currentModelName, rows);

      if (columns.length === 0) {
        sheet.addRow(['id']);
        continue;
      }

      sheet.columns = columns.map((column) => ({
        header: column,
        key: column,
        width: Math.max(14, Math.min(40, column.length + 4)),
      }));
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };

      for (const row of rows) {
        const encodedRow: Record<string, string | number | boolean> = {};
        for (const column of columns) {
          encodedRow[column] = encodeExcelCellValue(row[column]);
        }
        sheet.addRow(encodedRow);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importExcelData(
    fileBuffer: Buffer,
    targetModel?: string,
    skipClear: boolean = false,
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as ExcelWorkbookLoadInput);

    const metaSheet = workbook.getWorksheet(EXCEL_META_SHEET);
    const sheetMap = new Map<string, string>();
    if (metaSheet) {
      metaSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const modelName = row.getCell(1).text?.trim();
        const sheetName = row.getCell(2).text?.trim();
        if (modelName && sheetName) {
          sheetMap.set(modelName, sheetName);
        }
      });
    }

    const modelNames = targetModel
      ? [targetModel]
      : sheetMap.size > 0
        ? [...sheetMap.keys()]
        : workbook.worksheets
            .map((sheet) => sheet.name)
            .filter((name) => name !== EXCEL_META_SHEET);

    const data: Record<string, any[]> = {};

    for (const modelName of modelNames) {
      const worksheet =
        workbook.getWorksheet(sheetMap.get(modelName) ?? modelName) ??
        workbook.getWorksheet(modelName);
      if (!worksheet) continue;

      const headerRow = worksheet.getRow(1);
      const headerValues = Array.isArray(headerRow.values)
        ? headerRow.values.slice(1)
        : [];
      const headers = headerValues
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);
      if (headers.length === 0) {
        data[modelName] = [];
        continue;
      }

      const rows: Record<string, unknown>[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const record: Record<string, unknown> = {};
        let hasValue = false;

        headers.forEach((header, index) => {
          const parsed = parseExcelCellValue(row.getCell(index + 1).value);
          if (parsed === undefined) return;
          record[header] = parsed;
          hasValue = true;
        });

        if (hasValue) {
          rows.push(record);
        }
      });

      data[modelName] = rows;
    }

    return this.importData(data, targetModel, skipClear);
  }

  /** Tránh lệch bảng: mọi entity trong ORM phải có trong entityByModelName và ngược lại. */
  private assertExportRegistryCoversOrmEntities(): void {
    const mapped = new Set(Object.keys(entityByModelName));
    for (const E of ormEntities) {
      const m = entityClassToExportModelName(E);
      if (!entityByModelName[m]) {
        this.logger.error(
          `Cấu hình export thiếu model "${m}" cho ${E.name} — bổ sung entityByModelName + modelOrder.`,
        );
      }
    }
    for (const m of mapped) {
      const ok = ormEntities.some((E) => entityClassToExportModelName(E) === m);
      if (!ok) {
        this.logger.warn(
          `entityByModelName có "${m}" nhưng không có trong ormEntities — kiểm tra lại.`,
        );
      }
    }
  }

  /** Bỏ pivot trỏ tới post/category không tồn tại (tránh lỗi FK / file export lệch). */
  private async filterSanitizedPostCategories(
    em: EntityManager,
    sanitized: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
    const postIds = [
      ...new Set(
        sanitized
          .map((r) => r.post as string)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const categoryIds = [
      ...new Set(
        sanitized
          .map((r) => r.category as string)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [existingPosts, existingCats] = await Promise.all([
      postIds.length
        ? em.find(Post, { id: { $in: postIds } }, { fields: ['id'] })
        : [],
      categoryIds.length
        ? em.find(Category, { id: { $in: categoryIds } }, { fields: ['id'] })
        : [],
    ]);
    const pSet = new Set(existingPosts.map((p) => p.id));
    const cSet = new Set(existingCats.map((c) => c.id));
    const out = sanitized.filter(
      (r) => pSet.has(r.post as string) && cSet.has(r.category as string),
    );
    if (out.length < sanitized.length) {
      this.logger.warn(
        `postCategory: bỏ qua ${sanitized.length - out.length} dòng (post hoặc category không có trong DB).`,
      );
    }
    return out;
  }

  private applyUserImportRowsDefaults(
    rows: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    const now = new Date();
    const fallbackHash = getImportUserFallbackPasswordHash();
    let missingPw = 0;
    const next = rows.map((row) => {
      const r = { ...row };
      const pw = r.password;
      if (pw == null || (typeof pw === 'string' && pw.trim() === '')) {
        r.password = fallbackHash;
        missingPw++;
      }
      r.createdAt = coerceImportDate(r.createdAt, now);
      r.updatedAt = coerceImportDate(r.updatedAt, now);
      if (r.isActive === undefined) r.isActive = true;
      else r.isActive = Boolean(r.isActive);
      return r;
    });
    if (missingPw > 0) {
      this.logger.warn(
        `user import: ${missingPw} bản ghi thiếu password — dùng hash từ IMPORT_FALLBACK_PASSWORD_PLAIN (mặc định ImportFallback#2026). Yêu cầu đổi mật khẩu sau đăng nhập.`,
      );
    }
    return next;
  }

  /** Tránh 500 FK: chỉ chèn user_roles khi user + role đã có trong DB. */
  private async filterSanitizedUserRoles(
    em: EntityManager,
    sanitized: Record<string, unknown>[],
  ): Promise<Record<string, unknown>[]> {
    const userIds = [
      ...new Set(
        sanitized
          .map((r) => r.user as string)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const roleIds = [
      ...new Set(
        sanitized
          .map((r) => r.role as string)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const [users, roles] = await Promise.all([
      userIds.length
        ? em.find(User, { id: { $in: userIds } }, { fields: ['id'] })
        : [],
      roleIds.length
        ? em.find(Role, { id: { $in: roleIds } }, { fields: ['id'] })
        : [],
    ]);
    const uSet = new Set(users.map((u) => u.id));
    const rSet = new Set(roles.map((ro) => ro.id));
    const out = sanitized.filter(
      (row) => uSet.has(row.user as string) && rSet.has(row.role as string),
    );
    if (out.length < sanitized.length) {
      this.logger.warn(
        `userRole: bỏ qua ${sanitized.length - out.length} dòng (userId hoặc roleId không tồn tại — import user và role trước).`,
      );
    }
    return out;
  }

  private sanitizeExportedPivotTables(data: Record<string, unknown>): void {
    const { droppedPostCategory, droppedPostTag } =
      sanitizePivotRowsInExportJson(data);
    if (droppedPostCategory > 0) {
      this.logger.warn(
        `Export: loại ${droppedPostCategory} postCategory trỏ tới post/category không có trong cùng file export.`,
      );
    }
    if (droppedPostTag > 0) {
      this.logger.warn(
        `Export: loại ${droppedPostTag} postTag trỏ tới post/tag không có trong cùng file export.`,
      );
    }
  }

  /**
   * pageContent: dùng persist + flush (như seed-full-export), tránh lỗi insertMany + cột JSON trên MySQL.
   */
  private async insertPageContentsWithPersist(
    em: EntityManager,
    rows: Record<string, unknown>[],
  ): Promise<void> {
    const now = new Date();
    for (const r of rows) {
      const id = r.id != null ? String(r.id as string | number) : '';
      if (!id) {
        throw new Error('pageContent import: thiếu id');
      }
      const contentRaw = normalizeContentJsonForImport(r.content);
      const content = plainJsonRecord(contentRaw);
      const e = new PageContent();
      e.id = id;
      e.pageKey = r.pageKey != null ? String(r.pageKey as string | number) : '';
      e.sectionKey =
        r.sectionKey != null ? String(r.sectionKey as string | number) : '';
      e.content = content;
      e.isVisible = Boolean(r.isVisible ?? true);
      e.createdAt = coerceImportDate(r.createdAt, now);
      e.updatedAt = coerceImportDate(r.updatedAt, now);
      em.persist(e);
    }
    await em.flush();
  }

  private async insertSanitizedModel(
    em: EntityManager,
    mName: string,
    sanitized: Record<string, unknown>[],
  ): Promise<void> {
    const entity = entityByModelName[mName];
    if (!entity || sanitized.length === 0) return;

    let rows = sanitized;
    if (mName === 'postCategory') {
      rows = await this.filterSanitizedPostCategories(em, sanitized);
      if (rows.length === 0) return;
    }

    if (mName === 'user') {
      rows = this.applyUserImportRowsDefaults(rows);
    }

    if (mName === 'userRole') {
      rows = await this.filterSanitizedUserRoles(em, rows);
      if (rows.length === 0) return;
    }

    if (mName === 'role') {
      rows = rows.map((r) => ({
        ...r,
        permissions: stripHeroSlidesPermissions(r.permissions),
      }));
    }

    if (mName === 'pageContent') {
      const startTime = Date.now();
      await this.insertPageContentsWithPersist(em, rows);
      this.logger.debug(
        `Imported ${rows.length} pageContent (persist) in ${Date.now() - startTime}ms`,
      );
      return;
    }

    const startTime = Date.now();
    try {
      await em.insertMany(entity, rows as object[]);
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      this.logger.warn(
        `insertMany toàn bộ ${mName} thất bại (${message}), thử theo lô nhỏ hơn…`,
      );
      const batchSize = Math.max(
        1,
        parseInt(process.env.SYSTEM_IMPORT_DB_BATCH_SIZE || '500', 10) || 500,
      );
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        try {
          await em.insertMany(entity, chunk as object[]);
        } catch (inner: unknown) {
          const innerMsg = getErrorMessage(inner);
          this.logger.debug(
            `Batch insert failed for ${mName}, fallback từng dòng: ${innerMsg}`,
          );
          for (const record of chunk) {
            try {
              await em.insert(entity, record as object);
            } catch (rowErr: unknown) {
              const errMsg = getErrorMessage(rowErr);
              if (
                !errMsg.toLowerCase().includes('unique') &&
                !errMsg.toLowerCase().includes('constraint')
              ) {
                throw rowErr;
              }
            }
          }
        }
      }
    }
    this.logger.debug(
      `Imported ${rows.length} records into ${mName} in ${Date.now() - startTime}ms`,
    );
  }

  /**
   * Trước khi xóa toàn bộ users: bỏ liên kết nullable tới users (FK thường là NO ACTION).
   * Import `?model=user` không xóa contact_requests/messages/students trước — cần bước này.
   */
  private async detachNullableUserForeignKeys(
    em: EntityManager,
  ): Promise<void> {
    await em.nativeUpdate(
      ContactRequest,
      {},
      {
        submittedBy: null,
        assignedTo: null,
      },
    );
    await em.nativeUpdate(Message, {}, { receiver: null, sender: null });
    await em.nativeUpdate(Student, {}, { user: null });
  }

  /**
   * categories.parentId → categories.id: schema thực tế có thể ON DELETE NO ACTION.
   * nativeDelete toàn bảng sẽ lỗi khi còn hàng con trỏ tới cha — bỏ liên kết cây trước.
   */
  private async clearCategoryTableForImport(em: EntityManager): Promise<void> {
    const meta = em.getMetadata().get(Category.name);
    const table = meta.tableName;
    const parentCol = meta.properties.parent?.fieldNames[0] ?? 'parentId';
    await em
      .getConnection()
      .execute(`UPDATE \`${table}\` SET \`${parentCol}\` = NULL`);
    await em.nativeDelete(Category, {});
  }

  /**
   * Một request: xóa user (CASCADE xóa user_roles) + insert user + insert user_roles.
   * Tránh 403 giữa các HTTP: sau khi replace user, phiên hiện tại mất role nếu userRole ở request sau.
   */
  private async importUsersWithRolesInTransaction(
    userRows: any[],
    userRoleRows: any[],
    skipClear: boolean,
  ): Promise<void> {
    await this.em.transactional(async (em) => {
      const conn = em.getConnection();
      const driverName = em.getDriver().constructor.name;
      const isMysqlFamily = /mysql|mariadb/i.test(driverName);
      const isSqlite = /sqlite/i.test(driverName);

      if (isMysqlFamily) await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
      if (isSqlite) await conn.execute('PRAGMA foreign_keys = OFF');

      try {
        if (!skipClear) {
          const startTime = Date.now();
          await this.detachNullableUserForeignKeys(em);
          await em.nativeDelete(User, {});
          this.logger.debug(
            `Cleared data from user (and cascaded user_roles) in ${Date.now() - startTime}ms`,
          );
        }
        if (userRows.length > 0) {
          const sanitized = userRows.map((r) =>
            this.pickImportPayload(em, User, r as Record<string, unknown>),
          );
          await this.insertSanitizedModel(em, 'user', sanitized);
        }
        if (userRoleRows.length > 0) {
          const sanitized = userRoleRows.map((r) =>
            this.pickImportPayload(em, UserRole, r as Record<string, unknown>),
          );
          await this.insertSanitizedModel(em, 'userRole', sanitized);
        }
        if (userRows.length > 0) {
          await ensureSeedUserRoleLinks(em);
        }
      } finally {
        if (isMysqlFamily) await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
        if (isSqlite) await conn.execute('PRAGMA foreign_keys = ON');
      }
    });
  }

  /** Chỉ giữ field map được tới cột DB, tránh lỗi insert khi JSON export có key thừa. */
  private pickImportPayload(
    em: EntityManager,
    entity: EntityName<any>,
    row: Record<string, unknown>,
  ): Record<string, unknown> {
    const entityKey =
      typeof entity === 'string'
        ? entity
        : typeof entity === 'function'
          ? entity.name
          : String(entity as unknown as string);
    const meta = em.getMetadata().get(entityKey);
    const out: Record<string, unknown> = {};

    for (const prop of Object.values(meta.properties)) {
      if (shouldSkipImportProperty(prop)) continue;

      let raw: unknown;
      if (Object.prototype.hasOwnProperty.call(row, prop.name)) {
        raw = row[prop.name];
      } else if (prop.fieldNames?.length) {
        const col = prop.fieldNames[0];
        if (
          col &&
          col !== prop.name &&
          Object.prototype.hasOwnProperty.call(row, col)
        ) {
          raw = row[col];
        }
      }
      if (raw === undefined) continue;
      let val = normalizeImportScalar(prop, raw);
      if (
        prop.name === 'content' &&
        (entityKey === 'Post' || entityKey === 'PageContent')
      ) {
        val = normalizeContentJsonForImport(val);
      }
      out[prop.name] = val;
    }
    return out;
  }

  getModels() {
    return this.modelOrder.map((modelName) => {
      const entity = entityByModelName[modelName];
      const entityName =
        typeof entity === 'string'
          ? entity
          : typeof entity === 'function'
            ? entity.name
            : modelName;
      const meta = this.em.getMetadata().find(entityName);
      return {
        modelName,
        tableName: meta?.tableName ?? entityName,
      };
    });
  }

  getDatabaseSchema() {
    const tables: Array<{
      name: string;
      domain: string;
      description: string;
      columns: Array<{
        name: string;
        type: string;
        kind: 'pk' | 'fk' | 'field';
        nullable?: boolean;
        references?: string;
      }>;
    }> = [];
    const relations: Array<{
      fromTable: string;
      fromColumn: string;
      toTable: string;
      toColumn: string;
      cardinality: 'many-to-one' | 'one-to-one' | 'self';
      deleteRule?: 'cascade' | 'set null' | 'restrict';
    }> = [];

    const domainMapping: Record<string, string> = {
      User: 'Identity',
      Role: 'Identity',
      UserRole: 'Identity',
      Account: 'Auth',
      Session: 'Auth',
      Student: 'Student',
      ParentStudent: 'Student',
      ContactRequest: 'Support',
      Post: 'Content',
      Category: 'Content',
      Tag: 'Content',
      PostCategory: 'Content',
      PostTag: 'Content',
      Comment: 'Content',
      Group: 'Messaging',
      GroupMember: 'Messaging',
      Message: 'Messaging',
      MessageRead: 'Messaging',
      Notification: 'Messaging',
      PageContent: 'System',
      Setting: 'System',
      AdmissionResult: 'System',
      VerificationToken: 'Auth',
    };

    const descriptionMapping: Record<string, string> = {
      User: 'Tai khoan nguoi dung, phu huynh va nhan su noi bo.',
      Role: 'Vai tro va tap permission RBAC.',
      UserRole: 'Bang pivot gan nhieu role cho mot user.',
      Account: 'Tai khoan OAuth/provider lien ket voi user.',
      Session: 'Phien dang nhap va refresh token.',
      Student: 'Ho so hoc sinh noi bo lien ket tuy chon voi user.',
      ParentStudent: 'Phu huynh gui yeu cau lien ket voi ma sinh vien.',
      ContactRequest: 'Yeu cau lien he va xu ly tuyen sinh/ho tro.',
      Post: 'Bai viet, thong bao, su kien va noi dung truyen thong.',
      Category: 'Cay danh muc cha-con cho bai viet.',
      Tag: 'The gan cho bai viet qua pivot post_tags.',
      PostCategory: 'Pivot many-to-many giua posts va categories.',
      PostTag: 'Pivot many-to-many giua posts va tags.',
      Comment: 'Binh luan cua user tren post.',
      Group: 'Nhom hoi thoai/thong bao.',
      GroupMember: 'Thanh vien nhom vai tro trong nhom.',
      Message: 'Tin nhan ca nhan, nhom va thread tra loi.',
      MessageRead: 'Trang thai da doc theo user va message.',
      Notification: 'Thong bao he thong theo user.',
      PageContent: 'Noi dung trang tinh/CMS.',
      Setting: 'Cau hinh key-value cua he thong.',
      AdmissionResult: 'Ket qua tuyen sinh.',
      VerificationToken: 'Token xac thuc email/password reset.',
    };

    for (const modelName of this.modelOrder) {
      const entity = entityByModelName[modelName];
      if (!entity) continue;

      const entityName =
        typeof entity === 'string'
          ? entity
          : typeof entity === 'function'
            ? entity.name
            : modelName;
      const meta = this.em.getMetadata().find(entityName);
      if (!meta) continue;

      const tableName = meta.tableName || entityName;
      const domain = domainMapping[entityName] || 'System';
      const description = descriptionMapping[entityName] || '';

      const columns: Array<{
        name: string;
        type: string;
        kind: 'pk' | 'fk' | 'field';
        nullable?: boolean;
        references?: string;
      }> = [];

      for (const [propName, prop] of Object.entries(meta.properties)) {
        const propKind = String((prop as { kind?: string }).kind || '');
        const kind = prop.primary
          ? 'pk'
          : propKind.includes('1:1') || propKind.includes('m:1')
            ? 'fk'
            : 'field';
        const type = prop.columnTypes?.[0] || String(prop.type || 'unknown');
        const nullable = prop.nullable ?? false;
        let references: string | undefined;

        // For foreign keys, try to get the referenced entity
        if (kind === 'fk') {
          const targetMeta = (prop as { targetMeta?: { className?: string } })
            .targetMeta;
          if (targetMeta?.className) {
            references = `${targetMeta.className}.id`;
          }
        }

        columns.push({
          name: prop.fieldNames?.[0] || propName,
          type,
          kind,
          nullable,
          references,
        });
      }

      tables.push({
        name: tableName,
        domain,
        description,
        columns,
      });
    }

    // Extract relationships from entity metadata
    for (const modelName of this.modelOrder) {
      const entity = entityByModelName[modelName];
      if (!entity) continue;

      const entityName =
        typeof entity === 'string'
          ? entity
          : typeof entity === 'function'
            ? entity.name
            : modelName;
      const meta = this.em.getMetadata().find(entityName);
      if (!meta) continue;

      const fromTable = meta.tableName || entityName;

      for (const [propName, prop] of Object.entries(meta.properties)) {
        const propKind = String((prop as { kind?: string }).kind || '');
        // Check if this is a relationship property (1:1, m:1, 1:m, m:n)
        const isRelation =
          propKind.includes('1:1') ||
          propKind.includes('m:1') ||
          propKind.includes('1:m') ||
          propKind.includes('m:n');
        if (!isRelation) continue;

        const targetMeta = (prop as { targetMeta?: { className?: string } })
          .targetMeta;
        if (!targetMeta?.className) continue;

        const refMeta = this.em
          .getMetadata()
          .find(targetMeta.className as EntityName<any>);
        if (!refMeta) continue;

        const toTable = refMeta.tableName || targetMeta.className;
        const fromColumn = prop.fieldNames?.[0] || propName;
        const toColumn = 'id';

        let cardinality: 'many-to-one' | 'one-to-one' | 'self' = 'many-to-one';
        if (targetMeta.className === entityName) {
          cardinality = 'self';
        } else if (propKind === '1:1') {
          cardinality = 'one-to-one';
        }

        const deleteRule = (prop as { deleteRule?: string }).deleteRule as
          | 'cascade'
          | 'set null'
          | 'restrict'
          | undefined;

        relations.push({
          fromTable,
          fromColumn,
          toTable,
          toColumn,
          cardinality,
          deleteRule,
        });
      }
    }

    return { tables, relations };
  }

  /** Giống `pnpm run seed:superadmin` — idempotent, dùng từ API bảo trì. */
  async runSuperadminBootstrapSeed(): Promise<SuperadminBootstrapResult> {
    return runSuperadminBootstrap(this.em.fork());
  }

  /**
   * Pivot chỉ có PK = ManyToOne: `serialize()` không ổn định / không khớp `postId`+`categoryId`
   * như bundle import cũ — xuất thủ công từ khóa chính quan hệ.
   */
  private async exportPostCategoryRows(): Promise<
    Array<{ postId: string; categoryId: string }>
  > {
    const rows = await this.em.find(PostCategory, {});
    return rows.map((pc) => ({
      postId: String(wrap(pc.post, true).getPrimaryKey()),
      categoryId: String(wrap(pc.category, true).getPrimaryKey()),
    }));
  }

  private async exportPostTagRows(): Promise<
    Array<{ postId: string; tagId: string }>
  > {
    const rows = await this.em.find(PostTag, {});
    return rows.map((pt) => ({
      postId: String(wrap(pt.post, true).getPrimaryKey()),
      tagId: String(wrap(pt.tag, true).getPrimaryKey()),
    }));
  }

  /** User: đảm bảo export cả password hash (serialize() có thể bỏ qua hidden fields). */
  private async exportUserRows(): Promise<Record<string, unknown>[]> {
    const rows = await this.em.find(User, {});
    return rows.map((u) => {
      const obj = wrap(u).toObject() as Record<string, unknown>;
      obj.password = u.password;
      return obj;
    });
  }

  async exportData(modelName?: string) {
    this.logger.log(
      `Starting data export ${modelName ? `for ${modelName}` : 'all models'}...`,
    );
    const data: Record<string, any[]> = {};

    const exportOrder = modelName
      ? [modelName]
      : [...this.modelOrder].reverse();

    for (const mName of exportOrder) {
      data[mName] = [];
      try {
        const entity = entityByModelName[mName];
        if (entity) {
          if (mName === 'postCategory') {
            data[mName] = await this.exportPostCategoryRows();
          } else if (mName === 'postTag') {
            data[mName] = await this.exportPostTagRows();
          } else if (mName === 'user') {
            data[mName] = await this.exportUserRows();
          } else {
            const rows = await this.em.find(entity, {});
            data[mName] = serialize(rows) as object[];
          }
          this.logger.debug(
            `Exported ${data[mName].length} records from ${mName}`,
          );
        } else {
          this.logger.warn(`Export: không có entity cho model "${mName}"`);
        }
      } catch (error) {
        this.logger.error(`Error exporting model ${mName}:`, error);
        data[mName] = [];
      }
    }

    if (!modelName) {
      this.sanitizeExportedPivotTables(data);
    }

    return data;
  }

  async importData(
    data: Record<string, any[]>,
    targetModel?: string,
    skipClear: boolean = false,
  ) {
    this.logger.log(
      `Starting data import ${targetModel ? `for ${targetModel}` : 'all models'} (skipClear: ${skipClear})...`,
    );

    const droppedHero = stripLegacyHeroSlideFromBundle(
      data as Record<string, unknown>,
    );
    if (droppedHero > 0) {
      this.logger.log(
        `Import: bỏ key heroSlide (${droppedHero} bản ghi legacy — không còn bảng).`,
      );
    }

    // Nếu import tất cả models, chia nhỏ và import từng model riêng
    if (!targetModel && Object.keys(data).length > 1) {
      return this.importDataByModels(data, skipClear);
    }

    if (
      targetModel === 'user' &&
      Object.prototype.hasOwnProperty.call(data, 'userRole') &&
      Object.prototype.hasOwnProperty.call(data, 'user')
    ) {
      this.logger.log(
        `Import user + userRole trong một transaction (skipClear: ${skipClear})…`,
      );
      await this.importUsersWithRolesInTransaction(
        Array.isArray(data.user) ? data.user : [],
        Array.isArray(data.userRole) ? data.userRole : [],
        skipClear,
      );
      return { success: true, message: 'Data imported successfully' };
    }

    // Import single model hoặc khi chỉ có 1 model
    await this.em.transactional(async (em) => {
      const conn = em.getConnection();
      const driverName = em.getDriver().constructor.name;
      const isMysqlFamily = /mysql|mariadb/i.test(driverName);
      const isSqlite = /sqlite/i.test(driverName);

      if (isMysqlFamily) await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
      if (isSqlite) await conn.execute('PRAGMA foreign_keys = OFF');

      try {
        const clearOrder = targetModel ? [targetModel] : this.modelOrder;

        // Chỉ clear nếu skipClear=false
        if (!skipClear) {
          for (const mName of clearOrder) {
            try {
              const entity = entityByModelName[mName];
              if (entity) {
                if (mName === 'user') {
                  await this.detachNullableUserForeignKeys(em);
                }
                const startTime = Date.now();
                if (mName === 'category') {
                  await this.clearCategoryTableForImport(em);
                } else {
                  await em.nativeDelete(entity, {});
                }
                const duration = Date.now() - startTime;
                this.logger.debug(
                  `Cleared data from ${mName} in ${duration}ms`,
                );
              }
            } catch (error) {
              this.logger.error(`Error clearing model ${mName}:`, error);
              throw error;
            }
          }
        }

        const importOrder = targetModel
          ? [targetModel]
          : [...this.modelOrder].reverse();

        for (const mName of importOrder) {
          const records = data[mName];
          if (records && records.length > 0) {
            try {
              const entity = entityByModelName[mName];
              if (entity) {
                let sanitized = records.map((r) =>
                  this.pickImportPayload(
                    em,
                    entity,
                    r as Record<string, unknown>,
                  ),
                );
                if (mName === 'category') {
                  sanitized = orderCategoryRowsForImport(sanitized);
                }
                await this.insertSanitizedModel(em, mName, sanitized);
              }
            } catch (error) {
              this.logger.error(`Error importing model ${mName}:`, error);
              throw error;
            }
          }
        }

        // Xóa `roles` CASCADE xóa `user_roles` — request kế (import user) mất quyền → 403.
        if (!skipClear && targetModel === 'role') {
          this.logger.debug(
            'Sau import role: bổ sung lại user_roles seed (nếu user + role tồn tại).',
          );
          await ensureSeedUserRoleLinks(em);
        }
      } finally {
        if (isMysqlFamily) await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
        if (isSqlite) await conn.execute('PRAGMA foreign_keys = ON');
      }
    });
    return { success: true, message: 'Data imported successfully' };
  }

  /** Thứ tự an toàn FK khi mỗi lần chỉ import một bảng (vd. role → user → userRole). */
  private orderModelsForDependencySafeImport(models: string[]): string[] {
    const set = new Set(models);
    const out: string[] = [];
    const take = (m: string) => {
      if (set.has(m)) {
        out.push(m);
        set.delete(m);
      }
    };
    take('role');
    take('user');
    take('userRole');
    // Giống import một request: [...modelOrder].reverse() — post/tag/category trước postCategory/postTag.
    for (const m of [...this.modelOrder].reverse()) {
      take(m);
    }
    for (const m of set) {
      out.push(m);
    }
    return out;
  }

  private async importDataByModels(
    data: Record<string, any[]>,
    skipClear: boolean = false,
  ) {
    this.logger.log(
      'Importing data theo từng model (một request HTTP / model từ client)…',
    );
    const results: Array<{
      model: string;
      success: boolean;
      result?: any;
      error?: any;
    }> = [];

    const presentModels = this.modelOrder.filter(
      (m) =>
        entityByModelName[m] && Array.isArray(data[m]) && data[m].length > 0,
    );
    const ordered = this.orderModelsForDependencySafeImport(presentModels);
    const skipModels = new Set<string>();

    for (const modelName of ordered) {
      if (skipModels.has(modelName)) continue;
      const records = data[modelName];
      if (records && records.length > 0) {
        try {
          this.logger.log(
            `Importing ${modelName} (${records.length} records)...`,
          );
          const payload: Record<string, any[]> = { [modelName]: records };
          if (
            modelName === 'user' &&
            Object.prototype.hasOwnProperty.call(data, 'userRole')
          ) {
            payload.userRole = Array.isArray(data.userRole)
              ? data.userRole
              : [];
            skipModels.add('userRole');
          }
          const result = await this.importData(payload, modelName, skipClear);
          results.push({ model: modelName, success: true, result });
          this.logger.log(`Successfully imported ${modelName}`);
        } catch (error) {
          this.logger.error(`Failed to import ${modelName}:`, error);
          results.push({ model: modelName, success: false, error });
          // Không throw error để tiếp tục import các model khác
        }
      }
    }

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      return {
        success: false,
        message: `Imported ${results.length - failed.length}/${results.length} models successfully`,
        results,
        failed: failed.map((f) => f.model),
      };
    }

    return {
      success: true,
      message: `Imported ${results.length} models successfully`,
      results,
    };
  }
}
