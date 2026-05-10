import {
  Entity,
  Enum,
  Index,
  ManyToOne,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Order workflow (cash-on-delivery only):
 *   pending     → vừa tạo, chờ xác nhận tại kho
 *   confirmed   → kho đã xác nhận sẽ giao (đã giữ tồn kho)
 *   shipped     → nhân viên kho/giao vận đã xuất kho lên đường
 *   delivered   → nhân viên giao đã trao hàng & thu tiền (COD)
 *   cancelled   → huỷ trước khi giao, hoàn lại tồn kho
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

export interface OrderItem {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  totalPrice: number;
  qtyPerUnit?: number;
  image?: string;
}

@Entity({ tableName: 'orders' })
export class Order extends BaseEntity {
  @Property()
  @Unique()
  orderNumber!: string;

  @ManyToOne(() => User, { nullable: true, fieldName: 'customerId' })
  customer?: User;

  /** NV giao hàng được quản trị chỉ định (role `shipper`). */
  @ManyToOne(() => User, { nullable: true, fieldName: 'assignedShipperId' })
  assignedShipper?: User;

  @Property()
  customerName!: string;

  @Property()
  customerEmail!: string;

  @Property({ nullable: true })
  customerPhone?: string;

  @Property({ type: 'text', nullable: true })
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
  @Index()
  status: OrderStatus = OrderStatus.PENDING;

  @Property({ nullable: true })
  couponCode?: string;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Enum({ items: () => PaymentMethod, default: PaymentMethod.COD })
  paymentMethod: PaymentMethod = PaymentMethod.COD;

  @Enum({ items: () => PaymentStatus, default: PaymentStatus.UNPAID })
  @Index()
  paymentStatus: PaymentStatus = PaymentStatus.UNPAID;

  @Property({ default: false })
  isPaid: boolean = false;

  /** Người xác nhận xuất kho (warehouse). */
  @Property({ nullable: true })
  shippedBy?: string;

  @Property({ type: 'datetime', nullable: true })
  shippedAt?: Date;

  /** Người xác nhận giao thành công & thu tiền. */
  @Property({ nullable: true })
  deliveredBy?: string;

  @Property({ type: 'datetime', nullable: true })
  deliveredAt?: Date;

  @Property({ type: 'datetime', nullable: true })
  cancelledAt?: Date;
}
