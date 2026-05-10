import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

/**
 * Product category dictionary. Products reference a category by its `slug`
 * (kept as a free-form string on `Product.category` to avoid a hard FK and
 * to make the API portable across data stores).
 */
@Entity({ tableName: 'categories' })
export class Category extends BaseEntity {
  @Property({ length: 120 })
  @Index()
  name!: string;

  @Property({ length: 120 })
  @Unique()
  slug!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  /** Lucide icon name (e.g. "Droplets", "Soup", "Milk", "Package2"). */
  @Property({ length: 60, nullable: true })
  icon?: string;

  @Property({ default: 0 })
  sortOrder: number = 0;

  @Property({ default: true })
  isActive: boolean = true;
}
