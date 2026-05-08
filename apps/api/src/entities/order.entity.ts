import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  ManyToOne,
  Index,
} from '@mikro-orm/core';
import { User } from './user.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

@Entity()
export class Order {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number;

  @Property({ unique: true })
  @Index()
  orderNumber!: string;

  @ManyToOne(() => User, { nullable: true, fieldName: 'customerId' })
  customer?: User;

  @Property()
  customerName!: string;

  @Property()
  customerEmail!: string;

  @Property({ nullable: true })
  customerPhone?: string;

  @Property({ nullable: true, type: 'text' })
  shippingAddress?: string;

  @Property({ type: 'json' })
  items!: OrderItem[];

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  subtotal!: number;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  discountAmount: number = 0;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  shippingFee: number = 0;

  @Property({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalAmount!: number;

  @Enum({ items: () => OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus = OrderStatus.PENDING;

  @Property({ nullable: true })
  couponCode?: string;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @Property({ nullable: true })
  paymentMethod?: string;

  @Property({ default: false })
  isPaid: boolean = false;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
