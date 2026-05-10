import type { ApiClient } from '../client';
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from '../types';

export interface AdjustStockInput {
  delta: number;
  reason?: string;
}

export class ProductsApi {
  constructor(private readonly http: ApiClient) {}

  list(options?: { activeOnly?: boolean }): Promise<Product[]> {
    const query = options?.activeOnly ? '?active=true' : '';
    return this.http.get<Product[]>(`/products${query}`);
  }

  byCategory(category: string): Promise<Product[]> {
    return this.http.get<Product[]>(
      `/products/category/${encodeURIComponent(category)}`,
    );
  }

  bySku(sku: string): Promise<Product | null> {
    return this.http.get<Product | null>(
      `/products/sku/${encodeURIComponent(sku)}`,
    );
  }

  get(id: number): Promise<Product> {
    return this.http.get<Product>(`/products/${id}`);
  }

  create(input: CreateProductInput): Promise<Product> {
    return this.http.post<Product>('/products', input);
  }

  update(id: number, input: UpdateProductInput): Promise<Product> {
    return this.http.put<Product>(`/products/${id}`, input);
  }

  /** Adjust stock by a positive (inbound) or negative (outbound) delta. */
  adjustStock(id: number, input: AdjustStockInput): Promise<Product> {
    return this.http.patch<Product>(`/products/${id}/stock`, input);
  }

  remove(id: number): Promise<void> {
    return this.http.delete<void>(`/products/${id}`);
  }
}
