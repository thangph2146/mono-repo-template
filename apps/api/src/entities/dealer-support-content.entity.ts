import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

/**
 * Một bản ghi: ghi đè từng phần nội dung « Hỗ trợ đại lý » (merge lên package mặc định).
 */
@Entity({ tableName: 'dealer_support_contents' })
export class DealerSupportContent extends BaseEntity {
  @Property({ type: 'json' })
  overrides: Record<string, unknown> = {};
}
