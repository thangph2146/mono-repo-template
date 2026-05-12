import { ApiClient, type ApiClientOptions } from './client';
import { CategoriesApi } from './resources/categories';
import { OrdersApi } from './resources/orders';
import { ProductsApi } from './resources/products';
import { RbacApi } from './resources/rbac';
import { PromoCodesApi } from './resources/promo-codes';
import { DealerSupportApi } from './resources/dealer-support';
import { UsersApi } from './resources/users';
import type { HealthStatus } from './types';

/**
 * Default API URL when the consumer doesn't pass one. Kept as an export so
 * Next.js / NestJS callers can reuse it without hard-coding the value.
 */
export const DEFAULT_API_URL = 'http://localhost:3002/api';

/**
 * High-level facade exposed to UI code: `sdk.products.list()`,
 * `sdk.orders.byStatus("pending")`, `sdk.users.login(...)`, etc.
 *
 * The SDK is intentionally platform-agnostic: it does not read environment
 * variables itself. Each consumer (web app, NestJS service, mobile, ...) is
 * responsible for resolving its own `baseUrl` and injecting it here.
 */
export class StoreSyncSdk {
  readonly http: ApiClient;
  readonly products: ProductsApi;
  readonly users: UsersApi;
  readonly orders: OrdersApi;
  readonly categories: CategoriesApi;
  readonly rbac: RbacApi;
  readonly promoCodes: PromoCodesApi;
  readonly dealerSupport: DealerSupportApi;

  constructor(options: ApiClientOptions) {
    this.http = new ApiClient(options);
    this.products = new ProductsApi(this.http);
    this.users = new UsersApi(this.http);
    this.orders = new OrdersApi(this.http);
    this.categories = new CategoriesApi(this.http);
    this.rbac = new RbacApi(this.http);
    this.promoCodes = new PromoCodesApi(this.http);
    this.dealerSupport = new DealerSupportApi(this.http);
  }

  health(): Promise<HealthStatus> {
    return this.http.get<HealthStatus>('/health');
  }
}

/**
 * Convenience factory. Accepts a string (baseUrl only) or full options.
 * Falls back to {@link DEFAULT_API_URL} when nothing is supplied – useful for
 * tests; production consumers should always pass an explicit baseUrl.
 */
export const createStoreSyncSdk = (
  options: ApiClientOptions | string = DEFAULT_API_URL,
): StoreSyncSdk => {
  const opts: ApiClientOptions =
    typeof options === 'string' ? { baseUrl: options } : options;
  return new StoreSyncSdk(opts);
};
