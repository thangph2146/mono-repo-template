import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  type FilterQuery,
  type RequiredEntityData,
} from '@mikro-orm/core';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  User,
} from '../entities';
import { applyPromoCode } from '@workspace/promo-codes';
import { UsersService } from '../users/users.service';

/** Giá một dòng theo retail / wholesale + SL tối thiểu KM (khớp storefront). */
function effectiveLineUnitPrice(
  unit: {
    retailPrice: number;
    wholesalePrice: number | null;
    minWholesaleQty: number;
  },
  quantity: number,
): { unitPrice: number; listUnitPrice: number; isSaleActive: boolean } {
  const retail = Math.max(0, Math.floor(Number(unit.retailPrice) || 0));
  const rawW = unit.wholesalePrice;
  const wholesaleNum =
    rawW === null || rawW === undefined || !Number.isFinite(Number(rawW))
      ? null
      : Math.floor(Number(rawW));
  const minQ = Math.max(0, Math.floor(Number(unit.minWholesaleQty) || 0));
  const q = Math.max(1, Math.floor(quantity));

  if (wholesaleNum === null || wholesaleNum <= 0 || wholesaleNum >= retail) {
    return { unitPrice: retail, listUnitPrice: retail, isSaleActive: false };
  }

  const eligible = minQ <= 0 ? true : q >= minQ;
  return {
    unitPrice: eligible ? wholesaleNum : retail,
    listUnitPrice: retail,
    isSaleActive: eligible,
  };
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  unitType: string;
}

export interface CreateOrderDto {
  customerId?: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  notes?: string;
  couponCode?: string;
  items: CreateOrderItemDto[];
  paymentMethod?: PaymentMethod;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const ORDER_POPULATE = ['customer', 'assignedShipper'] as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find(
      { deletedAt: null },
      {
        populate: [...ORDER_POPULATE],
        orderBy: { createdAt: 'desc' },
      },
    );
  }

  async findStaffPage(opts: {
    email?: string;
    q?: string;
    status?: OrderStatus;
    page: number;
    limit: number;
  }): Promise<{ items: Order[]; total: number }> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(200, Math.max(1, opts.limit));
    const offset = (page - 1) * limit;
    const where: FilterQuery<Order> = { deletedAt: null };
    if (opts.email?.trim()) {
      where.customerEmail = opts.email.trim();
    }
    if (opts.status != null) {
      where.status = opts.status;
    }
    if (opts.q?.trim()) {
      const q = `%${opts.q.trim()}%`;
      where.$or = [
        { orderNumber: { $like: q } },
        { customerEmail: { $like: q } },
        { customerName: { $like: q } },
      ];
    }
    const [items, total] = await this.orderRepository.findAndCount(where, {
      populate: [...ORDER_POPULATE],
      orderBy: { createdAt: 'desc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async listTrashed(opts?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Order[]; total: number }> {
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 20));
    const offset = (page - 1) * limit;
    const where: FilterQuery<Order> = { deletedAt: { $ne: null } };
    if (opts?.q?.trim()) {
      const q = `%${opts.q.trim()}%`;
      where.$or = [
        { orderNumber: { $like: q } },
        { customerEmail: { $like: q } },
        { customerName: { $like: q } },
      ];
    }
    const [items, total] = await this.orderRepository.findAndCount(where, {
      populate: [...ORDER_POPULATE],
      orderBy: { updatedAt: 'desc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne(
      { id, deletedAt: null },
      { populate: [...ORDER_POPULATE] },
    );
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async findByCustomer(customerId: number): Promise<Order[]> {
    return this.orderRepository.find(
      { customer: customerId, deletedAt: null },
      { populate: [...ORDER_POPULATE], orderBy: { createdAt: 'desc' } },
    );
  }

  async findByCustomerEmail(email: string): Promise<Order[]> {
    return this.orderRepository.find(
      { customerEmail: email, deletedAt: null },
      { populate: [...ORDER_POPULATE], orderBy: { createdAt: 'desc' } },
    );
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find(
      { status, deletedAt: null },
      { populate: [...ORDER_POPULATE], orderBy: { createdAt: 'desc' } },
    );
  }

  async restore(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne(
      { id, deletedAt: { $ne: null } },
      { populate: [...ORDER_POPULATE] },
    );
    if (!order) {
      throw new NotFoundException(
        `No trashed order with id ${id} (or already visible)`,
      );
    }
    order.deletedAt = null;
    await this.orderRepository.getEntityManager().flush();
    return order;
  }

  /** Danh sách user có role `shipper` — admin/manager gán đơn (orders.write). */
  async listShippers(): Promise<Pick<User, 'id' | 'email' | 'fullName'>[]> {
    const users = await this.usersService.findByRoleCode('shipper');
    return users
      .filter((u) => u.isActive)
      .map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
      }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'));
  }

  /**
   * Gán / bỏ gán shipper. Chỉ user đang có role `shipper` được phép gán.
   */
  async assignShipper(
    orderId: number,
    shipperUserId: number | null,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    if (shipperUserId === null) {
      order.assignedShipper = undefined;
      await this.orderRepository.getEntityManager().flush();
      return this.findOne(orderId);
    }
    const shipper = await this.usersService.findOne(shipperUserId);
    if (!this.userHasRoleCode(shipper, 'shipper')) {
      throw new BadRequestException(
        `User ${shipper.email} không có vai trò shipper`,
      );
    }
    if (!shipper.isActive) {
      throw new BadRequestException('Tài khoản shipper đang bị vô hiệu hóa');
    }
    order.assignedShipper = shipper;
    await this.orderRepository.getEntityManager().flush();
    return this.findOne(orderId);
  }

  private userHasRoleCode(user: User, code: string): boolean {
    if (!user.userRoleLinks.isInitialized()) return false;
    const c = code.trim().toLowerCase();
    return user.userRoleLinks
      .getItems()
      .some((l) => l.role?.code?.trim().toLowerCase() === c);
  }

  /** Gộp các dòng trùng (cùng sản phẩm + cùng loại đơn vị) — cộng dồn số lượng. */
  private mergeCreateOrderItems(
    items: CreateOrderItemDto[],
  ): CreateOrderItemDto[] {
    const map = new Map<string, CreateOrderItemDto>();
    for (const raw of items) {
      const unitType = String(raw.unitType ?? '').trim();
      const k = `${raw.productId}:${unitType}`;
      const prev = map.get(k);
      const qty = Math.max(0, Math.floor(Number(raw.quantity) || 0));
      if (qty <= 0) continue;
      if (prev) {
        prev.quantity += qty;
      } else {
        map.set(k, {
          productId: raw.productId,
          unitType,
          quantity: qty,
        });
      }
    }
    return [...map.values()];
  }

  /**
   * Tạo đơn từ giỏ hàng. Server gộp dòng trùng, tra giá theo product/unit **tại
   * thời điểm đặt** và ghi vào JSON `items` — sau này đổi giá catalog không làm
   * đổi đơn đã lưu.
   */
  async create(dto: CreateOrderDto): Promise<Order> {
    const mergedItems = this.mergeCreateOrderItems(dto.items ?? []);
    if (mergedItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const em = this.orderRepository.getEntityManager();
    const productIds = Array.from(new Set(mergedItems.map((i) => i.productId)));
    const products = await this.productRepository.find({
      id: { $in: productIds },
      deletedAt: null,
    });
    const productMap = new Map<number, Product>();
    for (const p of products) productMap.set(p.id, p);

    const items: OrderItem[] = [];
    let subtotal = 0;

    for (const dtoItem of mergedItems) {
      const product = productMap.get(dtoItem.productId);
      if (!product) {
        throw new NotFoundException(
          `Product with id ${dtoItem.productId} not found`,
        );
      }
      if (dtoItem.quantity <= 0) {
        throw new BadRequestException(
          `Quantity for ${product.sku} must be positive`,
        );
      }

      const unit = this.resolveUnit(product, dtoItem.unitType);
      const eff = effectiveLineUnitPrice(unit, dtoItem.quantity);
      const listUnitPrice = eff.listUnitPrice;
      const unitPrice = eff.unitPrice;
      const totalPrice = unitPrice * dtoItem.quantity;
      const requiredStock = unit.qtyPerUnit * dtoItem.quantity;

      if (product.stock < requiredStock) {
        throw new ConflictException(
          `Out of stock: ${product.name} (need ${requiredStock} ${product.unit}, have ${product.stock})`,
        );
      }

      product.stock -= requiredStock;
      subtotal += totalPrice;
      const giftNote = product.fulfillmentNote?.trim();
      items.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: dtoItem.quantity,
        unitType: unit.type,
        unitPrice,
        totalPrice,
        qtyPerUnit: unit.qtyPerUnit,
        image: product.images?.[0],
        listUnitPrice,
        unitLabel: unit.label,
        ...(giftNote ? { giftNote } : {}),
      });
    }

    const cartLinesForPromo = mergedItems.map((i) => ({
      unitType: i.unitType,
      quantity: i.quantity,
    }));
    let discountAmount = 0;

    const rawCoupon = dto.couponCode?.trim();
    let couponCode: string | undefined;
    if (rawCoupon) {
      const promo = applyPromoCode(subtotal, rawCoupon, {
        cartLines: cartLinesForPromo,
        preAppliedDiscount: 0,
      });
      if (!promo.ok) {
        throw new BadRequestException(promo.message);
      }
      discountAmount += promo.discount;
      couponCode = promo.normalizedCode;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    const order = this.orderRepository.create({
      customer: dto.customerId ?? undefined,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      couponCode,
      items,
      subtotal,
      discountAmount,
      shippingFee: 0,
      totalAmount,
      status: OrderStatus.PENDING,
      paymentMethod: dto.paymentMethod ?? PaymentMethod.COD,
      paymentStatus: PaymentStatus.UNPAID,
      isPaid: false,
      orderNumber: this.generateOrderNumber(),
    } as RequiredEntityData<Order>);

    await em.persistAndFlush(order);
    this.logger.log(
      `Order ${order.orderNumber} created (${items.length} items, subtotal ${subtotal}, discount ${discountAmount}, total ${totalAmount})`,
    );
    return order;
  }

  /** Generic status update enforcing the workflow above. */
  async updateStatus(
    id: number,
    nextStatus: OrderStatus,
    actor?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status === nextStatus) return order;

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictException(
        `Cannot transition order ${order.orderNumber} from "${order.status}" to "${nextStatus}"`,
      );
    }

    if (nextStatus === OrderStatus.SHIPPED) {
      const fromAssignee = order.assignedShipper?.fullName;
      const actorName = actor?.trim();
      order.shippedBy = actorName || order.shippedBy || fromAssignee;
      order.shippedAt = new Date();
    }
    if (nextStatus === OrderStatus.DELIVERED) {
      order.deliveredBy = actor ?? order.deliveredBy;
      order.deliveredAt = new Date();
      order.paymentStatus = PaymentStatus.PAID;
      order.isPaid = true;
    }
    if (nextStatus === OrderStatus.CANCELLED) {
      await this.restoreStock(order);
      order.cancelledAt = new Date();
    }

    order.status = nextStatus;
    await this.orderRepository.getEntityManager().flush();
    return order;
  }

  /** Warehouse staff confirms the order is leaving the warehouse. */
  async confirmShipped(id: number, actor?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new ConflictException(
        `Order ${order.orderNumber} is not ready to ship (status=${order.status})`,
      );
    }
    return this.updateStatus(
      id,
      order.status === OrderStatus.PENDING
        ? OrderStatus.CONFIRMED
        : OrderStatus.SHIPPED,
      actor,
    );
  }

  /** Delivery staff confirms goods handed over and cash collected (COD). */
  async confirmDelivered(id: number, actor?: string): Promise<Order> {
    const order = await this.findOne(id);
    if (
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new ConflictException(
        `Order ${order.orderNumber} cannot be delivered (status=${order.status})`,
      );
    }
    if (order.status === OrderStatus.CONFIRMED) {
      await this.updateStatus(id, OrderStatus.SHIPPED, actor);
    }
    return this.updateStatus(id, OrderStatus.DELIVERED, actor);
  }

  async cancel(id: number, actor?: string): Promise<Order> {
    return this.updateStatus(id, OrderStatus.CANCELLED, actor);
  }

  /**
   * Đơn đã huỷ (tồn đã hoàn) → về `pending`: trừ tồn lại như lúc tạo đơn.
   * Xóa dấu vết giao/huỷ; thanh toán về chưa thu.
   */
  async reopenCancelled(id: number, actor?: string): Promise<Order> {
    void actor;
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.CANCELLED) {
      throw new ConflictException(
        `Chỉ đơn đã huỷ mới được mở lại (hiện: ${order.status})`,
      );
    }

    const items = this.orderItemsArray(order);
    if (!items.length) {
      throw new BadRequestException('Đơn không có dòng hàng');
    }

    const em = this.orderRepository.getEntityManager();
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await this.productRepository.find({
      id: { $in: productIds },
      deletedAt: null,
    });
    const map = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = map.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product id ${item.productId} not found`);
      }
      const required = (item.qtyPerUnit ?? 1) * item.quantity;
      if (product.stock < required) {
        throw new ConflictException(
          `Không đủ tồn để mở lại đơn: ${product.name} (cần ${required} ${product.unit}, còn ${product.stock})`,
        );
      }
      product.stock -= required;
    }

    order.status = OrderStatus.PENDING;
    order.cancelledAt = undefined;
    order.shippedAt = undefined;
    order.shippedBy = undefined;
    order.assignedShipper = undefined;
    order.deliveredAt = undefined;
    order.deliveredBy = undefined;
    order.paymentStatus = PaymentStatus.UNPAID;
    order.isPaid = false;

    await em.flush();
    this.logger.log(
      `Order ${order.orderNumber} reopened from cancelled → pending`,
    );
    return order;
  }

  async update(id: number, orderData: Partial<Order>): Promise<Order> {
    const order = await this.findOne(id);
    const safe = { ...orderData } as Partial<Order> & {
      assignedShipper?: unknown;
    };
    delete safe.assignedShipper;
    this.orderRepository.assign(order, safe);
    await this.orderRepository.getEntityManager().flush();
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);
    if (
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Chỉ có thể lưu trữ (xóa tạm) đơn đã huỷ hoặc đã giao xong.',
      );
    }
    order.deletedAt = new Date();
    await this.orderRepository.getEntityManager().flush();
  }

  /** Xóa hẳn đơn đang ở thùng rác (không thể hoàn tác). */
  async purgeTrashed(id: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!order) {
      throw new NotFoundException(
        `Không có đơn id ${id} trong thùng rác — chỉ xóa vĩnh viễn đơn đã lưu trữ.`,
      );
    }
    await this.orderRepository.getEntityManager().removeAndFlush(order);
  }

  /**
   * Cột JSON `items` đôi khi hydrate thành chuỗi (driver/DB) — cần mảng trước khi .map.
   */
  private orderItemsArray(order: Order): OrderItem[] {
    const raw = order.items as unknown;
    if (Array.isArray(raw)) return raw as OrderItem[];
    if (typeof raw === 'string') {
      const t = raw.trim();
      if (!t) return [];
      try {
        const p = JSON.parse(t) as unknown;
        return Array.isArray(p) ? (p as OrderItem[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private async restoreStock(order: Order): Promise<void> {
    const items = this.orderItemsArray(order);
    if (!items.length) return;
    const ids = items.map((i) => i.productId);
    const products = await this.productRepository.find({
      id: { $in: ids },
      deletedAt: null,
    });
    const map = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = map.get(item.productId);
      if (!product) continue;
      const restoreQty = (item.qtyPerUnit ?? 1) * item.quantity;
      product.stock += restoreQty;
    }
  }

  private resolveUnit(
    product: Product,
    unitType: string,
  ): {
    type: string;
    label: string;
    wholesalePrice: number | null;
    retailPrice: number;
    minWholesaleQty: number;
    qtyPerUnit: number;
  } {
    const units = product.unitTypes ?? [];
    const found = units.find((u) => u.type === unitType);
    if (found) return found;
    if (unitType === product.unit || !unitType) {
      return {
        type: product.unit,
        label: product.unit,
        wholesalePrice: product.wholesalePrice,
        retailPrice: product.retailPrice,
        minWholesaleQty: 1,
        qtyPerUnit: 1,
      };
    }
    throw new BadRequestException(
      `Product ${product.sku} does not support unit "${unitType}"`,
    );
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
  }
}
