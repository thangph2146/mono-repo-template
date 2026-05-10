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

/** Kết quả đăng nhập: user kèm union quyền hiệu lực (từ mọi role). */
export interface AuthUser extends User {
  permissions: string[];
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

/** Cập nhật hồ sơ đại lý (PUT /users/:id/profile) — không đổi email/mật khẩu/role. */
export type UpdateProfileInput = {
  fullName?: string;
  phone?: string;
  address?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export interface ProductUnitType {
  type: string;
  label: string;
  wholesalePrice: number | null;
  retailPrice: number;
  minWholesaleQty: number;
  qtyPerUnit: number;
}

/** Tham số lọc GET /products (admin / storefront có thể dùng từng phần). */
export interface ProductListParams {
  /** Tương đương ?active=true (chỉ còn bán) — ưu tiên khi không gửi isActive cụ thể. */
  activeOnly?: boolean;
  category?: string;
  brand?: string;
  /** SP không có brand (null / rỗng). */
  brandEmpty?: boolean;
  isActive?: boolean;
  /** Tìm theo SKU, tên, slug danh mục, brand (LIKE, không phân biệt hoa thường tùm DB). */
  q?: string;
  stock?: number;
  retailPrice?: number;
  /** Mức tồn: ok ≥50, low 1–49, out ≤0 (khớp admin computeStatus). */
  stockBand?: "ok" | "low" | "out";
  /** Lọc theo đơn vị tính (`unitTypes[].type` hoặc `unit`). */
  unitType?: string;
  /** Kiểu mua: sỉ (có giá sỉ) / lẻ (có đơn vị chỉ lẻ). */
  purchaseMode?: "si" | "le";
  /** Cùng `limit` → API trả `{ items, total }` thay vì mảng. */
  page?: number;
  limit?: number;
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

/** Kết quả phân trang từ GET /products?page=&limit= */
export interface ProductPagedResponse {
  items: Product[];
  total: number;
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

/** User được gán làm shipper cho đơn (populate từ API). */
export type AssignedShipperRef = Pick<User, 'id' | 'fullName' | 'email'>;

export interface Order extends AuditFields {
  orderNumber: string;
  customer?: User | null;
  assignedShipper?: AssignedShipperRef | null;
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
