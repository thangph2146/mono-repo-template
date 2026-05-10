import { createStoreSyncSdk, DEFAULT_API_URL } from "@workspace/api-client";

function readSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("storesync_session");
    if (!raw) return null;
    const s = JSON.parse(raw) as { id?: string };
    return s.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Single SDK instance shared across the storefront. Reads
 * `NEXT_PUBLIC_API_URL` so each environment can target its own backend.
 *
 * Next.js statically replaces `process.env.NEXT_PUBLIC_*` at build time,
 * so this works in both the browser and on the server.
 */
export const api = createStoreSyncSdk({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL,
  getUserId: () => readSessionUserId(),
});

export type {
  Product,
  ProductUnitType,
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
