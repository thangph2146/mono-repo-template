"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  api,
  type AdjustStockInput,
  type AssignedShipperRef,
  type Category,
  type CategoryUsage,
  type ChangePasswordInput,
  type CreateCategoryInput,
  type CreateProductInput,
  type Order,
  type OrderStatus,
  type Product,
  type ProductListParams,
  type UpdateCategoryInput,
  type UpdateProductInput,
  type UpdateProfileInput,
  type User,
} from "@/lib/api";

export const queryKeys = {
  products: () => ["products"] as const,
  product: (id: number) => ["products", id] as const,
  categories: () => ["categories"] as const,
  categoryUsage: () => ["categories", "usage"] as const,
  category: (id: number) => ["categories", id] as const,
  orders: () => ["orders"] as const,
  order: (id: number) => ["orders", id] as const,
  staffProfile: (id: number) => ["users", "staff-profile", id] as const,
};

export type ProductsListData = { items: Product[]; total: number };

export const useProducts = (opts?: {
  enabled?: boolean;
  listParams?: ProductListParams;
}): UseQueryResult<ProductsListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.products(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const res = await api.products.list(opts?.listParams);
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

export const useCreateProduct = (): UseMutationResult<
  Product,
  Error,
  CreateProductInput
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.products.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useUpdateProduct = (): UseMutationResult<
  Product,
  Error,
  { id: number; input: UpdateProductInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.products.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useAdjustStock = (): UseMutationResult<
  Product,
  Error,
  { id: number; input: AdjustStockInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.products.adjustStock(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useDeleteProduct = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.products.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useCategories = () =>
  useQuery<Category[], Error>({
    queryKey: queryKeys.categories(),
    queryFn: () => api.categories.list(),
  });

export const useCategoryUsage = () =>
  useQuery<CategoryUsage[], Error>({
    queryKey: queryKeys.categoryUsage(),
    queryFn: () => api.categories.usage(),
  });

export const useOrders = (opts?: { enabled?: boolean }) =>
  useQuery<Order[], Error>({
    queryKey: queryKeys.orders(),
    queryFn: () => api.orders.list(),
    enabled: opts?.enabled ?? true,
  });

export const useDispatchShippers = (opts?: { enabled?: boolean }) =>
  useQuery<AssignedShipperRef[], Error>({
    queryKey: ["orders", "dispatch", "shippers"] as const,
    queryFn: () => api.orders.listShippers(),
    enabled: opts?.enabled ?? true,
  });

export const useCreateCategory = (): UseMutationResult<
  Category,
  Error,
  CreateCategoryInput
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.categories.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useUpdateCategory = (): UseMutationResult<
  Category,
  Error,
  { id: number; input: UpdateCategoryInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.categories.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useDeleteCategory = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.categories.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useConfirmShipped = (): UseMutationResult<
  Order,
  Error,
  { id: number; actor?: string }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }) => api.orders.confirmShipped(id, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
    },
  });
};

export const useConfirmDelivered = (): UseMutationResult<
  Order,
  Error,
  { id: number; actor?: string }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }) => api.orders.confirmDelivered(id, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useCancelOrder = (): UseMutationResult<
  Order,
  Error,
  { id: number; actor?: string }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }) => api.orders.cancel(id, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useReopenCancelledOrder = (): UseMutationResult<
  Order,
  Error,
  { id: number; actor?: string }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actor }) => api.orders.reopenFromCancelled(id, actor),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useAssignOrderShipper = (): UseMutationResult<
  Order,
  Error,
  { id: number; shipperUserId: number | null }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, shipperUserId }) =>
      api.orders.assignShipper(id, shipperUserId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useStaffProfile = (userId: number | null | undefined) =>
  useQuery<User, Error>({
    queryKey: queryKeys.staffProfile(userId ?? -1),
    queryFn: () => api.users.get(userId as number),
    enabled: typeof userId === "number" && userId > 0,
  });

export const useUpdateStaffProfile = (): UseMutationResult<
  User,
  Error,
  { id: number; input: UpdateProfileInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.users.updateProfile(id, input),
    onSuccess: (u) => {
      qc.setQueryData(queryKeys.staffProfile(u.id), u);
    },
  });
};

export const useChangeStaffPassword = (): UseMutationResult<
  { ok: true },
  Error,
  { id: number; input: ChangePasswordInput }
> => {
  return useMutation({
    mutationFn: ({ id, input }) => api.users.changePassword(id, input),
  });
};
