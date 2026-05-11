import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

export type PromoDiscountKind = 'fixed' | 'percent';

/**
 * Mã giảm giá toàn đơn (nhập tay ở giỏ) — khác tag hiển thị trên sản phẩm.
 */
@Entity({ tableName: 'promo_codes' })
export class PromoCode extends BaseEntity {
  @Property({ length: 32 })
  @Unique()
  @Index()
  code!: string;

  @Property({ length: 200 })
  label!: string;

  @Property({ length: 16 })
  discountKind!: PromoDiscountKind;

  @Property({ type: 'integer', default: 0 })
  discountFixed: number = 0;

  @Property({ type: 'integer', default: 0 })
  discountPercent: number = 0;

  @Property({ type: 'integer', nullable: true })
  discountCapVnd?: number | null;

  @Property({ type: 'integer', default: 0 })
  minOrderSubtotal: number = 0;

  @Property({ default: true })
  @Index()
  isActive: boolean = true;

  @Property({ type: 'datetime', nullable: true })
  validFrom?: Date | null;

  @Property({ type: 'datetime', nullable: true })
  validUntil?: Date | null;

  /** null = không giới hạn số lần dùng */
  @Property({ type: 'integer', nullable: true })
  usageLimit?: number | null;

  @Property({ type: 'integer', default: 0 })
  usageCount: number = 0;
}
