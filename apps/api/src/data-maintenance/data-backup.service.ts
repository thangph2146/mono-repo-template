import {
  BadRequestException,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { MikroORM, serialize } from '@mikro-orm/core';
import type { EntityMetadata, EntityName } from '@mikro-orm/core';
import { ReferenceKind } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { reverseOrder, sortEntityMetasForImport } from './entity-order.util';
import { PERSISTENT_ENTITY_CLASSES } from '../entities/registry';

const BACKUP_FORMAT = 'storesync-mikro-backup' as const;
const SCHEMA_VERSION = 1 as const;

export interface StoreSyncBackupPayload {
  format: typeof BACKUP_FORMAT;
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: string;
  /** Tên class driver ORM (PostgreSqlDriver, …) */
  driverHint: string;
  /** className → mảng bản ghi plain object (serialize từ entity) */
  entities: Record<string, Record<string, unknown>[]>;
  /** Thứ tự insert đã tính từ metadata (className) */
  entityImportOrder: string[];
}

@Injectable()
export class DataBackupService {
  private readonly logger = new Logger(DataBackupService.name);

  constructor(private readonly orm: MikroORM) {}

  private resolveSqlMetas(): EntityMetadata[] {
    const driver = this.orm.em.getDriver();
    if (
      !(driver instanceof PostgreSqlDriver) &&
      !(driver instanceof MySqlDriver) &&
      !(driver instanceof SqliteDriver)
    ) {
      throw new NotImplementedException(
        'Backup/import JSON chỉ hỗ trợ PostgreSQL, MySQL hoặc SQLite.',
      );
    }

    return PERSISTENT_ENTITY_CLASSES.map((cls) =>
      this.orm.getMetadata().get(cls as never),
    ).filter((m) => !m.embeddable && Boolean(m.collection));
  }

  async exportJson(): Promise<StoreSyncBackupPayload> {
    const em = this.orm.em.fork();
    const metas = sortEntityMetasForImport(this.resolveSqlMetas());
    const entities: Record<string, Record<string, unknown>[]> = {};

    for (const meta of metas) {
      const EntityClass = meta.class;
      const findOpts =
        meta.className === 'User'
          ? { populate: ['userRoleLinks'] as const }
          : meta.className === 'Role'
            ? { populate: ['permissionLinks'] as const }
            : {};
      const rows = await em.find(EntityClass, {}, findOpts);
      entities[meta.className] = rows.map((row) =>
        serialize(row, {}) as Record<string, unknown>,
      );
    }

    const payload: StoreSyncBackupPayload = {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      driverHint: this.orm.em.getDriver().constructor.name,
      entities,
      entityImportOrder: metas.map((m) => m.className),
    };

    this.logger.log(
      `Backup JSON: ${Object.keys(entities).length} entity, ${Object.values(entities).reduce((n, r) => n + r.length, 0)} dòng`,
    );
    return payload;
  }

  async importJson(payload: unknown): Promise<{ inserted: number }> {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Payload không phải object JSON.');
    }
    const p = payload as Partial<StoreSyncBackupPayload>;
    if (p.format !== BACKUP_FORMAT || p.schemaVersion !== SCHEMA_VERSION) {
      throw new BadRequestException(
        `Chỉ chấp nhận backup format=${BACKUP_FORMAT}, schemaVersion=${SCHEMA_VERSION}.`,
      );
    }
    const entityPayload = p.entities;
    if (!entityPayload || typeof entityPayload !== 'object') {
      throw new BadRequestException('Thiếu trường entities.');
    }

    const orderedMetas = sortEntityMetasForImport(this.resolveSqlMetas());

    const missingInFile = orderedMetas.filter((m) => !(m.className in entityPayload));
    if (missingInFile.length > 0) {
      this.logger.warn(
        `Import: file thiếu entity so với schema hiện tại (coi như bảng trống): ${missingInFile.map((m) => m.className).join(', ')}`,
      );
    }

    let inserted = 0;
    const driver = this.orm.em.getDriver();
    const mysql = driver instanceof MySqlDriver;

    await this.orm.em.transactional(async (tx) => {
      if (mysql) {
        await tx.getConnection().execute('SET FOREIGN_KEY_CHECKS=0');
      }
      try {
        const deleteOrder = reverseOrder(orderedMetas);
        for (const meta of deleteOrder) {
          await tx.nativeDelete(meta.class as EntityName<object>, {});
        }

        for (const meta of orderedMetas) {
          const rows = entityPayload[meta.className];
          if (!Array.isArray(rows) || rows.length === 0) {
            continue;
          }
          for (const plain of rows) {
            const data = this.stripRelationObjects(meta, {
              ...(plain as Record<string, unknown>),
            });
            await tx.insert(meta.class as EntityName<object>, data);
            inserted++;
          }
        }
      } finally {
        if (mysql) {
          await tx.getConnection().execute('SET FOREIGN_KEY_CHECKS=1');
        }
      }
    });

    if (driver instanceof PostgreSqlDriver) {
      await this.syncPostgresSequences(orderedMetas);
    }

    this.logger.log(`Import JSON hoàn tất: ${inserted} bản ghi đã insert.`);
    return { inserted };
  }

  private async syncPostgresSequences(metas: EntityMetadata[]): Promise<void> {
    const conn = this.orm.em.getConnection();
    for (const meta of metas) {
      const table = meta.collection;
      const pkName = meta.primaryKeys[0];
      if (!table || !pkName) continue;
      const fq = [meta.schema, table].filter(Boolean).join('.');
      const fqLit = fq.replace(/'/g, "''");
      const pkLit = String(pkName).replace(/'/g, "''");
      const fromSql = meta.schema
        ? `"${meta.schema.replace(/"/g, '')}"."${String(table).replace(/"/g, '')}"`
        : `"${String(table).replace(/"/g, '')}"`;
      const pkQuoted = `"${String(pkName).replace(/"/g, '')}"`;
      try {
        await conn.execute(
          `SELECT setval(
            pg_get_serial_sequence('${fqLit}', '${pkLit}'),
            COALESCE((SELECT MAX(${pkQuoted}) FROM ${fromSql}), 1),
            true
          )`,
        );
      } catch {
        /* không phải serial / không có sequence */
      }
    }
  }

  /** Bỏ object quan hệ lồng nhau (nếu serialize từng embed FK object); giữ JSON scalar/array. */
  private stripRelationObjects(
    meta: EntityMetadata,
    plain: Record<string, unknown>,
  ): Record<string, unknown> {
    const out = { ...plain };
    for (const rel of Object.values(meta.relations)) {
      if (rel.kind !== ReferenceKind.MANY_TO_ONE) {
        continue;
      }
      const key = rel.name;
      const v = out[key];
      if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)) {
        delete out[key];
      }
    }
    for (const rel of Object.values(meta.relations)) {
      if (
        rel.kind === ReferenceKind.ONE_TO_MANY ||
        rel.kind === ReferenceKind.MANY_TO_MANY
      ) {
        delete out[rel.name];
      }
    }
    return out;
  }
}
