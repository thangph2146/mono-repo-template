import type { ApiClient } from '../client';
import type {
  CreateProductInput,
  Product,
  ProductListParams,
  ProductPagedResponse,
  UpdateProductInput,
} from '../types';

export interface AdjustStockInput {
  delta: number;
  reason?: string;
}

function appendProductListParams(
  sp: URLSearchParams,
  params: ProductListParams,
): void {
  if (params.activeOnly) sp.set('active', 'true');
  if (params.category) sp.set('category', params.category);
  if (params.brand) sp.set('brand', params.brand);
  if (params.brandEmpty) sp.set('brandEmpty', 'true');
  if (params.isActive === true) sp.set('isActive', 'true');
  if (params.isActive === false) sp.set('isActive', 'false');
  if (params.q) sp.set('q', params.q);
  if (params.stock !== undefined && Number.isFinite(params.stock)) {
    sp.set('stock', String(params.stock));
  }
  if (
    params.retailPrice !== undefined &&
    Number.isFinite(params.retailPrice)
  ) {
    sp.set('retailPrice', String(params.retailPrice));
  }
  if (params.stockBand) sp.set('stockBand', params.stockBand);
  if (params.unitType?.trim()) sp.set('unitType', params.unitType.trim());
  if (params.purchaseMode === 'si' || params.purchaseMode === 'le') {
    sp.set('purchaseMode', params.purchaseMode);
  }
  if (params.page !== undefined && Number.isFinite(params.page)) {
    sp.set('page', String(params.page));
  }
  if (params.limit !== undefined && Number.isFinite(params.limit)) {
    sp.set('limit', String(params.limit));
  }
}

export class ProductsApi {
  constructor(private readonly http: ApiClient) {}

  /**
   * Không gửi `page`+`limit` → mảng `Product[]`.
   * Có đủ `page` & `limit` → `{ items, total }`.
   */
  list(
    params?: ProductListParams,
  ): Promise<Product[] | ProductPagedResponse> {
    const sp = new URLSearchParams();
    if (params && Object.keys(params).length > 0) {
      appendProductListParams(sp, params);
    }
    const qs = sp.toString();
    return this.http.get<Product[] | ProductPagedResponse>(
      `/products${qs ? `?${qs}` : ''}`,
    );
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

  /** Danh sách sản phẩm đã xóa tạm (cần quyền ghi kho). */
  listTrashed(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<ProductPagedResponse> {
    const sp = new URLSearchParams();
    if (params?.q?.trim()) sp.set('q', params.q.trim());
    if (params?.page !== undefined && Number.isFinite(params.page)) {
      sp.set('page', String(params.page));
    }
    if (params?.limit !== undefined && Number.isFinite(params.limit)) {
      sp.set('limit', String(params.limit));
    }
    const qs = sp.toString();
    return this.http.get<ProductPagedResponse>(
      `/products/trashed${qs ? `?${qs}` : ''}`,
    );
  }

  restore(id: number): Promise<Product> {
    return this.http.post<Product>(`/products/${id}/restore`, {});
  }

  /** Xóa vĩnh viễn (chỉ bản ghi đang trong thùng rác). */
  purgeTrashed(id: number): Promise<void> {
    return this.http.delete<void>(`/products/${id}/permanent`);
  }
}
