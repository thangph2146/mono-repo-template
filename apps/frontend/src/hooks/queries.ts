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
  type CreateOrderInput,
  type Order,
  type OrderStatus,
  type Product,
  type User,
} from "@/lib/api";

export const queryKeys = {
  products: () => ["products"] as const,
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
};

export const useProducts = (): UseQueryResult<Product[], Error> =>
  useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => api.products.list(),
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
