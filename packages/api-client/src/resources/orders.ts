import type { ApiClient } from '../client';
import type {
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
    return this.http.get<Order[]>(`/orders${query}`);
  }

  byStatus(status: OrderStatus): Promise<Order[]> {
    return this.http.get<Order[]>(`/orders/status/${status}`);
  }

  byCustomer(customerId: number): Promise<Order[]> {
    return this.http.get<Order[]>(`/orders/customer/${customerId}`);
  }

  get(id: number): Promise<Order> {
    return this.http.get<Order>(`/orders/${id}`);
  }

  create(input: CreateOrderInput): Promise<Order> {
    return this.http.post<Order>('/orders', input);
  }

  update(id: number, input: UpdateOrderInput): Promise<Order> {
    return this.http.put<Order>(`/orders/${id}`, input);
  }

  updateStatus(
    id: number,
    status: OrderStatus,
    actor?: string,
  ): Promise<Order> {
    return this.http.put<Order>(`/orders/${id}/status`, { status, actor });
  }

  /** Warehouse staff confirms the order has shipped. */
  confirmShipped(id: number, actor?: string): Promise<Order> {
    return this.http.post<Order>(`/orders/${id}/confirm-shipped`, { actor });
  }

  /** Delivery staff confirms goods handed over and cash collected (COD). */
  confirmDelivered(id: number, actor?: string): Promise<Order> {
    return this.http.post<Order>(`/orders/${id}/confirm-delivered`, { actor });
  }

  cancel(id: number, actor?: string): Promise<Order> {
    return this.http.post<Order>(`/orders/${id}/cancel`, { actor });
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/orders/${id}`);
  }
}
