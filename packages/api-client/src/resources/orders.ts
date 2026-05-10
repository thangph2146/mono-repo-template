import type { ApiClient } from '../client';
import { normalizeOrder } from '../normalize-order';
import type {
  AssignedShipperRef,
  CreateOrderInput,
  Order,
  OrderStatus,
  UpdateOrderInput,
} from '../types';

export class OrdersApi {
  constructor(private readonly http: ApiClient) {}

  list(options?: { email?: string }): Promise<Order[]> {
    const query = options?.email
      ? `?email=${encodeURIComponent(options.email)}`
      : '';
    return this.http
      .get<Order[]>(`/orders${query}`)
      .then((rows) => rows.map(normalizeOrder));
  }

  byStatus(status: OrderStatus): Promise<Order[]> {
    return this.http
      .get<Order[]>(`/orders/status/${status}`)
      .then((rows) => rows.map(normalizeOrder));
  }

  byCustomer(customerId: number): Promise<Order[]> {
    return this.http
      .get<Order[]>(`/orders/customer/${customerId}`)
      .then((rows) => rows.map(normalizeOrder));
  }

  get(id: number): Promise<Order> {
    return this.http
      .get<Order>(`/orders/${id}`)
      .then((o) => normalizeOrder(o));
  }

  /** Nhân viên có role `shipper` — cần orders.write. */
  listShippers(): Promise<AssignedShipperRef[]> {
    return this.http.get<AssignedShipperRef[]>('/orders/dispatch/shippers');
  }

  assignShipper(
    id: number,
    shipperUserId: number | null,
  ): Promise<Order> {
    return this.http
      .put<Order>(`/orders/${id}/assign-shipper`, {
        shipperUserId: shipperUserId ?? null,
      })
      .then((o) => normalizeOrder(o));
  }

  create(input: CreateOrderInput): Promise<Order> {
    return this.http
      .post<Order>('/orders', input)
      .then((o) => normalizeOrder(o));
  }

  update(id: number, input: UpdateOrderInput): Promise<Order> {
    return this.http
      .put<Order>(`/orders/${id}`, input)
      .then((o) => normalizeOrder(o));
  }

  updateStatus(
    id: number,
    status: OrderStatus,
    actor?: string,
  ): Promise<Order> {
    return this.http
      .put<Order>(`/orders/${id}/status`, { status, actor })
      .then((o) => normalizeOrder(o));
  }

  /** Warehouse staff confirms the order has shipped. */
  confirmShipped(id: number, actor?: string): Promise<Order> {
    return this.http
      .post<Order>(`/orders/${id}/confirm-shipped`, { actor })
      .then((o) => normalizeOrder(o));
  }

  /** Delivery staff confirms goods handed over and cash collected (COD). */
  confirmDelivered(id: number, actor?: string): Promise<Order> {
    return this.http
      .post<Order>(`/orders/${id}/confirm-delivered`, { actor })
      .then((o) => normalizeOrder(o));
  }

  cancel(id: number, actor?: string): Promise<Order> {
    return this.http
      .post<Order>(`/orders/${id}/cancel`, { actor })
      .then((o) => normalizeOrder(o));
  }

  /** Đơn đã huỷ → pending (trừ tồn lại). */
  reopenFromCancelled(id: number, actor?: string): Promise<Order> {
    return this.http
      .post<Order>(`/orders/${id}/reopen-from-cancelled`, { actor })
      .then((o) => normalizeOrder(o));
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/orders/${id}`);
  }
}
