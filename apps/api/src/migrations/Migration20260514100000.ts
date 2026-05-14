import { Migration } from '@mikro-orm/migrations';

/**
 * Thêm bảng parent_students: liên kết phụ huynh ↔ học sinh (qua studentCode).
 * Status workflow: pending → approved | rejected.
 */
export class Migration20260514100000 extends Migration {
  private async tableExists(tableName: string): Promise<boolean> {
    const rows = (await this.execute(
      `select 1 as ok from information_schema.tables where table_schema = database() and table_name = ? limit 1`,
      [tableName],
    )) as Array<{ ok?: number }>;
    return rows.length > 0;
  }

  async up(): Promise<void> {
    if (!(await this.tableExists('parent_students'))) {
      this.addSql(`
        CREATE TABLE \`parent_students\` (
          \`id\`          varchar(36)  NOT NULL,
          \`parentId\`    varchar(255) NOT NULL,
          \`studentCode\` varchar(255) NOT NULL,
          \`studentName\` varchar(255) NULL,
          \`note\`        text         NULL,
          \`status\`      varchar(20)  NOT NULL DEFAULT 'pending',
          \`reviewedBy\`  varchar(255) NULL,
          \`reviewedAt\`  datetime     NULL,
          \`createdAt\`   datetime     NOT NULL,
          \`updatedAt\`   datetime     NOT NULL,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`parent_students_parentId_studentCode_unique\` (\`parentId\`, \`studentCode\`),
          KEY \`parent_students_parentId_index\` (\`parentId\`),
          KEY \`parent_students_status_index\` (\`status\`)
        ) ENGINE = InnoDB;
      `);
    }
    await Promise.resolve();
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `parent_students`;');
    await Promise.resolve();
  }
}
