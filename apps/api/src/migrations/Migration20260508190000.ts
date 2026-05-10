import { Migration } from '@mikro-orm/migrations';

/**
 * Thêm cột giỏ hàng đồng bộ; dùng INFORMATION_SCHEMA để tránh lỗi khi cột đã tồn tại.
 * Mỗi câu lệnh một addSql vì driver MySQL không gửi multi-statement trong một round-trip.
 */
export class Migration20260508190000 extends Migration {
  override up(): void {
    this.addSql('set @dbname = database()');
    this.addSql(`
      set @preparedStatement = (
        select if(
          (
            select count(*) from information_schema.columns
            where table_schema = @dbname
              and table_name = 'users'
              and column_name = 'cartJson'
          ) > 0,
          'select 1',
          'alter table \`users\` add column \`cartJson\` longtext null'
        )
      )
    `);
    this.addSql('prepare stmt from @preparedStatement');
    this.addSql('execute stmt');
    this.addSql('deallocate prepare stmt');
  }

  override down(): void {
    this.addSql('set @dbname = database()');
    this.addSql(`
      set @preparedStatement = (
        select if(
          (
            select count(*) from information_schema.columns
            where table_schema = @dbname
              and table_name = 'users'
              and column_name = 'cartJson'
          ) = 0,
          'select 1',
          'alter table \`users\` drop column \`cartJson\`'
        )
      )
    `);
    this.addSql('prepare stmt from @preparedStatement');
    this.addSql('execute stmt');
    this.addSql('deallocate prepare stmt');
  }
}
