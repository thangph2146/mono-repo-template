import { createStoreSyncSdk, DEFAULT_API_URL } from "@workspace/api-client";
import { getAdminDevAuthLogContext, getAdminUserId } from "./auth-session";

/**
 * Single SDK instance shared across the admin panel.
 * `X-User-Id` lấy từ phiên đăng nhập (sessionStorage) để RBAC trên API khớp.
 */
export const api = createStoreSyncSdk({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  getUserId: () => {
    if (typeof window === "undefined") return null;
    return getAdminUserId();
  },
  // Bắt buộc bật rõ: trong browser không có globalThis.process nên api-client
  // không tự nhận NODE_ENV; Next vẫn inline process.env.NODE_ENV ở đây.
  devLogging: process.env.NODE_ENV === "development",
  devLogTag: "storesync-admin",
  getDevAuthContext: () => getAdminDevAuthLogContext(),
});

export type {
  AdjustStockInput,
  AssignedShipperRef,
  AuthUser,
  ChangePasswordInput,
  CreateUserInput,
  Product,
  ProductListParams,
  ProductUnitType,
  CreateProductInput,
  UpdateProductInput,
  Order,
  OrderItem,
  RbacPermission,
  RbacRole,
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
  UpdateProfileInput,
  UpdateUserInput,
  PromoCode,
  PromoDiscountKind,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
} from "@workspace/api-client";
export { ApiError } from "@workspace/api-client";
