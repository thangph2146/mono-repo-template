"use client";

/**
 * Centralised TanStack Query hooks for the storefront.
 * Each hook owns its query-key and mutation invalidations so call sites stay
 * tiny: `const { data } = useProducts();`.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  api,
  type Category,
  type CategoryUsage,
  type CreateOrderInput,
  type Order,
  type OrderStatus,
  type Product,
  type ProductListParams,
  type ProductPagedResponse,
  type User,
  type UpdateProfileInput,
} from "@/lib/api";

export const queryKeys = {
  products: () => ["products"] as const,
  productsCatalog: (p: ProductListParams & { page: number; limit: number }) =>
    ["products", "catalog", p] as const,
  product: (id: number) => ["products", id] as const,
  productBySku: (sku: string) => ["products", "sku", sku] as const,
  productsByCategory: (slug: string) => ["products", "category", slug] as const,
  categories: (activeOnly?: boolean) =>
    ["categories", { activeOnly: !!activeOnly }] as const,
  category: (slug: string) => ["categories", "slug", slug] as const,
  categoryUsage: () => ["categories", "usage"] as const,
  orders: (email?: string) => ["orders", { email: email ?? null }] as const,
  order: (id: number) => ["orders", id] as const,
  user: (email: string) => ["users", "email", email] as const,
  userById: (id: number) => ["users", "id", id] as const,
};

/** Trang chủ / xem nhanh: toàn bộ SP đang bán (không phân trang). */
export const useProducts = (): UseQueryResult<Product[], Error> =>
  useQuery({
    queryKey: ["products", "active-all"],
    queryFn: async () => {
      const res = await api.products.list({ activeOnly: true });
      return Array.isArray(res) ? res : res.items;
    },
  });

/** Danh mục storefront: lọc + phân trang qua GET /products. */
export const useCatalogProducts = (
  params: ProductListParams & { page: number; limit: number },
) =>
  useQuery<ProductPagedResponse, Error>({
    queryKey: queryKeys.productsCatalog(params),
    queryFn: async () => {
      const res = await api.products.list(params);
      if (!res || Array.isArray(res)) {
        throw new Error("API phải trả { items, total } khi có page & limit");
      }
      return res;
    },
  });

export const useCategoryUsage = () =>
  useQuery<CategoryUsage[], Error>({
    queryKey: queryKeys.categoryUsage(),
    queryFn: () => api.categories.usage(),
  });

export const useProduct = (id: number | null | undefined) =>
  useQuery({
    queryKey: queryKeys.product(id ?? -1),
    queryFn: () => api.products.get(id as number),
    enabled: typeof id === "number" && id > 0,
  });

export const useProductBySku = (sku: string | null | undefined) =>
  useQuery({
    queryKey: queryKeys.productBySku(sku ?? ""),
    queryFn: () => api.products.bySku(sku as string),
    enabled: !!sku,
  });

export const useCategories = (activeOnly = false) =>
  useQuery<Category[], Error>({
    queryKey: queryKeys.categories(activeOnly),
    queryFn: () => api.categories.list({ activeOnly }),
  });

export const useCategoryBySlug = (slug: string | null | undefined) =>
  useQuery<Category, Error>({
    queryKey: queryKeys.category(slug ?? ""),
    queryFn: () => api.categories.bySlug(slug as string),
    enabled: !!slug,
  });

export const useOrders = (email?: string) =>
  useQuery<Order[], Error>({
    queryKey: queryKeys.orders(email),
    queryFn: () => api.orders.list({ email }),
    enabled: !!email?.trim(),
  });

export const useOrder = (id: number | null | undefined) =>
  useQuery<Order, Error>({
    queryKey: queryKeys.order(id ?? -1),
    queryFn: () => api.orders.get(id as number),
    enabled: typeof id === "number" && id > 0,
  });

export const useUserByEmail = (email: string | null | undefined) =>
  useQuery<User | null, Error>({
    queryKey: queryKeys.user(email ?? ""),
    queryFn: () => api.users.byEmail(email as string),
    enabled: !!email,
  });

/** Hồ sơ theo id — dùng cho đại lý (gửi X-User-Id); byEmail cần users.manage. */
export const useUserById = (id: number | null | undefined) =>
  useQuery<User, Error>({
    queryKey: queryKeys.userById(id ?? -1),
    queryFn: () => api.users.get(id as number),
    enabled: typeof id === "number" && id > 0,
  });

export const useUpdateProfile = (): UseMutationResult<
  User,
  Error,
  { id: number; input: UpdateProfileInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.users.updateProfile(id, input),
    onSuccess: (user) => {
      qc.setQueryData(queryKeys.userById(user.id), user);
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useCreateOrder = (): UseMutationResult<
  Order,
  Error,
  CreateOrderInput
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.orders.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateOrderStatus = (): UseMutationResult<
  Order,
  Error,
  { id: number; status: OrderStatus; actor?: string }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, actor }) =>
      api.orders.updateStatus(id, status, actor),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      qc.setQueryData(queryKeys.order(order.id), order);
    },
  });
};
