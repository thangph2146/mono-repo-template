import type { ApiClient } from '../client';
import { normalizeOrder } from '../normalize-order';
import type {
  AssignedShipperRef,
  CreateOrderInput,
  Order,
  OrderStatus,
  StaffOrderStatusCounts,
  UpdateOrderInput,
} from '../types';

export type OrderListOptions = {
  email?: string;
  q?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
};

export class OrdersApi {
  constructor(private readonly http: ApiClient) {}

  list(options?: OrderListOptions): Promise<Order[] | { items: Order[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.email?.trim()) p.set('email', options.email.trim());
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.status != null) p.set('status', options.status);
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http
      .get<Order[] | { items: Order[]; total: number }>(
        `/orders${qs ? `?${qs}` : ''}`,
      )
      .then((res) => {
        if (Array.isArray(res)) {
          return res.map(normalizeOrder);
        }
        return {
          items: res.items.map(normalizeOrder),
          total: res.total,
        };
      });
  }

  listTrashed(options?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Order[]; total: number }> {
    const p = new URLSearchParams();
    if (options?.q?.trim()) p.set('q', options.q.trim());
    if (options?.page != null) p.set('page', String(options.page));
    if (options?.limit != null) p.set('limit', String(options.limit));
    const qs = p.toString();
    return this.http
      .get<{ items: Order[]; total: number }>(
        `/orders/trashed${qs ? `?${qs}` : ''}`,
      )
      .then((res) => ({
        items: res.items.map(normalizeOrder),
        total: res.total,
      }));
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

  /** Đếm đơn theo trạng thái — orders.read; tối ưu cho polling badge. */
  staffStatusCounts(): Promise<StaffOrderStatusCounts> {
    return this.http.get<StaffOrderStatusCounts>(
      '/orders/staff/status-counts',
    );
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

  restore(id: number): Promise<Order> {
    return this.http
      .post<Order>(`/orders/${id}/restore`, {})
      .then((o) => normalizeOrder(o));
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/orders/${id}`);
  }

  /** Xóa vĩnh viễn (chỉ đơn đang trong thùng rác). */
  purgeTrashed(id: number): Promise<void> {
    return this.http.delete<void>(`/orders/${id}/permanent`);
  }
}
