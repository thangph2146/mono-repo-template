import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Product {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number;

  @Property({ unique: true })
  sku!: string;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @Property()
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

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
