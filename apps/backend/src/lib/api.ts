import { createStoreSyncSdk, DEFAULT_API_URL } from "@workspace/api-client";

/**
 * Single SDK instance shared across the admin panel.
 */
export const api = createStoreSyncSdk({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
});

export type {
  AdjustStockInput,
  Product,
  ProductUnitType,
  CreateProductInput,
  UpdateProductInput,
  Order,
  OrderItem,
  User,
  UserRoleRef,
  OrderStatus,
  Category,
  CategoryUsage,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateOrderInput,
  CreateOrderItemInput,
  PaymentMethod,
  PaymentStatus,
} from "@workspace/api-client";
export { ApiError } from "@workspace/api-client";
