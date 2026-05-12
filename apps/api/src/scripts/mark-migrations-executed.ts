/**
 * Baseline: ghi vào mikro_orm_migrations khi schema DB đã đúng nhưng chưa từng chạy migration:up
 * (vd. tạo bằng schema:sync / import SQL). MikroORM 5 CLI không có migration:resolve.
 *
 * Cách dùng (từ thư mục tuyen-sinh-api):
 *   pnpm run migration:pending
 *   pnpm run migration:mark-executed -- Migration20260503140000
 *   pnpm run migration:mark-executed -- --all-pending
 *     (khi DB đã đúng schema như sau schema:sync — ghi nhận hết pending, rồi mới migration:up)
 */
import 'dotenv/config';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { createMikroConfig } from '../mikro-orm/mikro-orm.module';

function migrationBaseName(raw: string): string {
  return raw.replace(/\.(ts|js)$/i, '').replace(/^.*[/\\]/, '');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const allPending = args.includes('--all-pending');
  const nameArgs = args.filter((a) => !a.startsWith('-'));
  if (!allPending && !nameArgs.length) {
    console.error(
      'Thiếu tên migration hoặc --all-pending. Ví dụ:\n' +
        '  pnpm run migration:mark-executed -- Migration20260503140000\n' +
        '  pnpm run migration:mark-executed -- --all-pending\n' +
        'Xem pending: pnpm run migration:pending',
    );
    process.exit(1);
  }

  const config = createMikroConfig(new ConfigService(process.env));
  const orm = await MikroORM.init(config as never);
  try {
    const migrator = orm.getMigrator();
    const storage = migrator.getStorage();
    if (!storage) {
      throw new Error(
        'Không lấy được migration storage (Migrator.getStorage).',
      );
    }
    if (storage.ensureTable) {
      await storage.ensureTable();
    }
    const executed = new Set(
      (await storage.getExecutedMigrations()).map((r) =>
        migrationBaseName(r.name),
      ),
    );
    const toMark = allPending
      ? (await migrator.getPendingMigrations()).map((m) => m.name)
      : nameArgs;
    if (!toMark.length) {
      console.log(
        allPending
          ? 'Không có migration pending — không cần ghi nhận thêm.'
          : 'Không có tên migration nào.',
      );
      return;
    }
    if (allPending) {
      console.log(
        `Ghi nhận ${toMark.length} migration đang pending (schema DB phải đã khớp):`,
      );
      for (const n of toMark) {
        console.log(`  - ${migrationBaseName(n)}`);
      }
    }
    for (const raw of toMark) {
      const base = migrationBaseName(raw);
      const fileName = `${base}.ts`;
      if (executed.has(base)) {
        console.warn(`Đã ghi nhận trước đó: ${base}`);
        continue;
      }
      await storage.logMigration({ name: fileName, context: undefined });
      executed.add(base);
      console.log(`Đã ghi nhận: ${base}`);
    }
  } finally {
    await orm.close(true);
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
