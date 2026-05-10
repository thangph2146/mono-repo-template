import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, type RequiredEntityData } from '@mikro-orm/core';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
} from '../entities';
import { applyPromoCode } from '@workspace/promo-codes';

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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.findAll<'customer'>({
      populate: ['customer'],
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne<'customer'>(
      { id },
      { populate: ['customer'] },
    );
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async findByCustomer(customerId: number): Promise<Order[]> {
    return this.orderRepository.find<'customer'>(
      { customer: customerId },
      { populate: ['customer'], orderBy: { createdAt: 'desc' } },
    );
  }

  async findByCustomerEmail(email: string): Promise<Order[]> {
    return this.orderRepository.find<'customer'>(
      { customerEmail: email },
      { populate: ['customer'], orderBy: { createdAt: 'desc' } },
    );
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find<'customer'>(
      { status },
      { populate: ['customer'], orderBy: { createdAt: 'desc' } },
    );
  }

  /**
   * Tạo đơn từ giỏ hàng. Server tự tra giá theo product/unit để chống tampering.
   * Tồn kho được giữ chỗ ngay khi đơn ở trạng thái PENDING.
   */
  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const em = this.orderRepository.getEntityManager();
    const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
    const products = await this.productRepository.find({
      id: { $in: productIds },
    });
    const productMap = new Map<number, Product>();
    for (const p of products) productMap.set(p.id, p);

    const items: OrderItem[] = [];
    let subtotal = 0;

    for (const dtoItem of dto.items) {
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
      const unitPrice = unit.wholesalePrice ?? unit.retailPrice;
      const totalPrice = unitPrice * dtoItem.quantity;
      const requiredStock = unit.qtyPerUnit * dtoItem.quantity;

      if (product.stock < requiredStock) {
        throw new ConflictException(
          `Out of stock: ${product.name} (need ${requiredStock} ${product.unit}, have ${product.stock})`,
        );
      }

      product.stock -= requiredStock;
      subtotal += totalPrice;
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
      });
    }

    const rawCoupon = dto.couponCode?.trim();
    let discountAmount = 0;
    let couponCode: string | undefined;
    if (rawCoupon) {
      const promo = applyPromoCode(subtotal, rawCoupon);
      if (!promo.ok) {
        throw new BadRequestException(promo.message);
      }
      discountAmount = promo.discount;
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
      order.shippedBy = actor ?? order.shippedBy;
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

  async update(id: number, orderData: Partial<Order>): Promise<Order> {
    const order = await this.findOne(id);
    this.orderRepository.assign(order, orderData);
    await this.orderRepository.getEntityManager().flush();
    return order;
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);
    if (
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      await this.restoreStock(order);
    }
    await this.orderRepository.getEntityManager().removeAndFlush(order);
  }

  private async restoreStock(order: Order): Promise<void> {
    if (!order.items?.length) return;
    const ids = order.items.map((i) => i.productId);
    const products = await this.productRepository.find({ id: { $in: ids } });
    const map = new Map(products.map((p) => [p.id, p]));
    for (const item of order.items) {
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
