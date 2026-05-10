import { PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Abstract base entity shared by every persisted model.
 *
 * It encapsulates the primary key + audit timestamps so concrete entities
 * can stay focused on their domain fields. The `integer + autoincrement`
 * combo is portable across PostgreSQL (`SERIAL`), MySQL (`AUTO_INCREMENT`),
 * Microsoft SQL Server (`IDENTITY`), and SQLite (`AUTOINCREMENT`).
 *
 * For a MongoDB deployment, swap this base out for one that defines
 * `_id` with `type: 'ObjectId'` — the rest of the entity contracts remain
 * identical.
 */
export abstract class BaseEntity {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number;

  @Property({
    type: 'datetime',
    onCreate: () => new Date(),
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date = new Date();

  @Property({
    type: 'datetime',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date = new Date();
}
