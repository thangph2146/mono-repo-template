/**
 * Shared DTO contracts between the @api NestJS service and any consumer
 * (web frontend, admin backend, mobile, automation, ...).
 *
 * The shape mirrors the MikroORM entities in `apps/api/src/entities` so the
 * SDK never needs to keep parallel definitions in sync manually.
 */

export type Iso8601 = string;

export interface AuditFields {
  id: number;
  createdAt: Iso8601;
  updatedAt: Iso8601;
}

/** Một role gắn với user (nhiều role / union quyền). */
export interface UserRoleRef {
  code: string;
  name: string;
}

export interface User extends AuditFields {
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  roles: UserRoleRef[];
  isActive: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

/** Payload giỏ hàng lưu trên user (đồng bộ với localStorage storefront). */
export interface UserCartPayload {
  lines: Array<Record<string, unknown>>;
}

export type CreateUserInput = Omit<User, keyof AuditFields> & {
  password: string;
  /** Gán role theo mã (vd: admin, customer); thay thế toàn bộ khi update. */
  roleCodes?: string[];
};

export type UpdateUserInput = Partial<CreateUserInput>;

export interface ProductUnitType {
  type: string;
  label: string;
  wholesalePrice: number | null;
  retailPrice: number;
  minWholesaleQty: number;
  qtyPerUnit: number;
}

export interface Product extends AuditFields {
  sku: string;
  name: string;
  description?: string | null;
  category: string;
  brand?: string | null;
  origin?: string | null;
  basePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  unit: string;
  unitTypes?: ProductUnitType[] | null;
  images?: string[] | null;
  coupons?: string[] | null;
  isActive: boolean;
}

export type CreateProductInput = Omit<Product, keyof AuditFields>;
export type UpdateProductInput = Partial<CreateProductInput>;

export interface Category extends AuditFields {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type CreateCategoryInput = Omit<Category, keyof AuditFields>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CategoryUsage {
  slug: string;
  productCount: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod';
export type PaymentStatus = 'unpaid' | 'paid';

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

export interface Order extends AuditFields {
  orderNumber: string;
  customer?: User | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  couponCode?: string | null;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  isPaid: boolean;
  shippedBy?: string | null;
  shippedAt?: Iso8601 | null;
  deliveredBy?: string | null;
  deliveredAt?: Iso8601 | null;
  cancelledAt?: Iso8601 | null;
}

/** Item the storefront sends; server tra giá theo product/unit. */
export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
  unitType: string;
}

export interface CreateOrderInput {
  customerId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  notes?: string;
  couponCode?: string;
  paymentMethod?: PaymentMethod;
  items: CreateOrderItemInput[];
}
export type UpdateOrderInput = Partial<Omit<Order, keyof AuditFields>>;

export interface HealthStatus {
  status: 'ok';
  service: string;
  uptime: number;
  timestamp: Iso8601;
}
