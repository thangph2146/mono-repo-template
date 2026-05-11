import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'products' })
export class Product extends BaseEntity {
  @Property()
  @Unique()
  sku!: string;

  @Property()
  @Index()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property()
  @Index()
  category!: string;

  @Property({ nullable: true })
  brand?: string;

  @Property({ nullable: true })
  origin?: string;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  basePrice!: number;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  wholesalePrice!: number;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  retailPrice!: number;

  @Property({ default: 0 })
  stock!: number;

  @Property({ default: 'piece' })
  unit!: string;

  @Property({ type: 'json', nullable: true })
  unitTypes?: Array<{
    type: string;
    label: string;
    wholesalePrice: number | null;
    retailPrice: number;
    minWholesaleQty: number;
    qtyPerUnit: number;
  }>;

  @Property({ type: 'json', nullable: true })
  images?: string[];

  @Property({ type: 'json', nullable: true })
  coupons?: string[];

  /**
   * Hướng dẫn quà tặng / KM cho kho & shipper (không thay thế logic tự động).
   * Ví dụ: "Mua ≥5 thùng: tặng 1 ly (SKU quà: LY-CC, giá trị kê 0đ)."
   */
  @Property({ type: 'text', nullable: true })
  fulfillmentNote?: string;

  @Property({ default: true })
  isActive: boolean = true;

  /** Xóa mềm: có giá trị → ẩn khỏi kho & storefront; `null` → đang hoạt động. */
  @Property({ type: 'datetime', nullable: true })
  deletedAt?: Date | null;
}
