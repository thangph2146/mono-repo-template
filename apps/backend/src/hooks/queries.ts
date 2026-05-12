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
  type CreatePromoCodeInput,
  type CreateProductInput,
  type CreateUserInput,
  type Order,
  type OrderStatus,
  type Product,
  type PromoCode,
  type ProductListParams,
  type RbacPermission,
  type RbacRole,
  type UpdateCategoryInput,
  type UpdatePromoCodeInput,
  type UpdateProductInput,
  type UpdateProfileInput,
  type UpdateUserInput,
  type User,
} from "@/lib/api";
import type {
  DealerSupportAdminPayload,
  DealerSupportPublicPayload,
} from "@workspace/api-client";
import {
  computeDealerSupportDiff,
  getDealerSupportPublicPayload,
} from "@workspace/dealer-support";

export const queryKeys = {
  products: () => ["products"] as const,
  productsTrashed: () => ["products", "trashed"] as const,
  product: (id: number) => ["products", id] as const,
  categories: () => ["categories"] as const,
  categoriesTrashed: () => ["categories", "trashed"] as const,
  categoryUsage: () => ["categories", "usage"] as const,
  category: (id: number) => ["categories", id] as const,
  orders: () => ["orders"] as const,
  ordersTrashed: () => ["orders", "trashed"] as const,
  order: (id: number) => ["orders", id] as const,
  staffProfile: (id: number) => ["users", "staff-profile", id] as const,
  staffUserList: () => ["users", "staff-list"] as const,
  usersTrashed: () => ["users", "trashed"] as const,
  dealers: () => ["users", "dealers"] as const,
  rbacCatalog: () => ["rbac", "catalog"] as const,
  promoCodes: () => ["promo-codes"] as const,
  dealerSupportAdmin: () => ["dealer-support", "admin"] as const,
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
      void qc.invalidateQueries({ queryKey: queryKeys.productsTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useTrashedProducts = (opts?: {
  enabled?: boolean;
  listParams?: { page?: number; limit?: number; q?: string };
}): UseQueryResult<ProductsListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.productsTrashed(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const lp = opts?.listParams;
      const res = await api.products.listTrashed({
        page: lp?.page ?? 1,
        limit: lp?.limit ?? 20,
        q: lp?.q,
      });
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

export const useRestoreProduct = (): UseMutationResult<
  Product,
  Error,
  number
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.products.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.productsTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const usePurgeTrashedProduct = (): UseMutationResult<
  void,
  Error,
  number
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.products.purgeTrashed(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
      void qc.invalidateQueries({ queryKey: queryKeys.productsTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useCategories = (opts?: { enabled?: boolean }) =>
  useQuery<Category[], Error>({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const res = await api.categories.list();
      return Array.isArray(res) ? res : res.items;
    },
    enabled: opts?.enabled ?? true,
  });

export type CategoriesListData = { items: Category[]; total: number };

export const useCategoriesAdmin = (opts?: {
  enabled?: boolean;
  listParams?: { q?: string; page?: number; limit?: number };
}): UseQueryResult<CategoriesListData, Error> =>
  useQuery({
    queryKey: [
      ...queryKeys.categories(),
      "admin",
      opts?.listParams ?? null,
    ] as const,
    queryFn: async () => {
      const res = await api.categories.list({
        q: opts?.listParams?.q,
        page: opts?.listParams?.page,
        limit: opts?.listParams?.limit,
      });
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

export const useTrashedCategories = (opts?: {
  enabled?: boolean;
  listParams?: { page?: number; limit?: number; q?: string };
}): UseQueryResult<CategoriesListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.categoriesTrashed(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const lp = opts?.listParams;
      const res = await api.categories.listTrashed({
        page: lp?.page ?? 1,
        limit: lp?.limit ?? 15,
        q: lp?.q,
      });
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

export const useCategoryUsage = () =>
  useQuery<CategoryUsage[], Error>({
    queryKey: queryKeys.categoryUsage(),
    queryFn: () => api.categories.usage(),
  });

export type OrdersListData = { items: Order[]; total: number };

export const useOrders = (opts?: {
  enabled?: boolean;
  listParams?: {
    q?: string;
    email?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  };
}): UseQueryResult<OrdersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.orders(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const res = await api.orders.list(opts?.listParams);
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

const PENDING_ORDERS_PREVIEW_LIMIT = 12;

/** Đơn chờ xử lý (rút gọn) cho popover thông báo admin; cùng nhịch polling với badge. */
export const usePendingOrdersPreview = (opts?: {
  enabled?: boolean;
  liveRefresh?: boolean;
}) =>
  useQuery<Order[], Error>({
    queryKey: [
      ...queryKeys.orders(),
      "pending-preview",
      PENDING_ORDERS_PREVIEW_LIMIT,
    ] as const,
    queryFn: async () => {
      const res = await api.orders.list({
        status: "pending",
        page: 1,
        limit: PENDING_ORDERS_PREVIEW_LIMIT,
      });
      return Array.isArray(res) ? res : res.items;
    },
    enabled: opts?.enabled ?? true,
    refetchInterval: opts?.liveRefresh ? 5_000 : false,
    staleTime: opts?.liveRefresh ? 0 : undefined,
  });

export const useTrashedOrders = (opts?: {
  enabled?: boolean;
  listParams?: { page?: number; limit?: number; q?: string };
}): UseQueryResult<OrdersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.ordersTrashed(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const lp = opts?.listParams;
      const res = await api.orders.listTrashed({
        page: lp?.page ?? 1,
        limit: lp?.limit ?? 20,
        q: lp?.q,
      });
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

/** Đếm đơn theo trạng thái (song song, mỗi trạng thái 1 request nhẹ). */
export type OrderStatusTabKey =
  | "ALL"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export const useOrderStatusCounts = (opts?: {
  enabled?: boolean;
  /** Polling ~5s: badge + thông báo đơn mới (chỉ bật khi cần realtime gần đúng). */
  liveRefresh?: boolean;
}) =>
  useQuery<Record<OrderStatusTabKey, number>, Error>({
    queryKey: ["orders", "status-counts"] as const,
    queryFn: () => api.orders.staffStatusCounts(),
    enabled: opts?.enabled ?? true,
    refetchInterval: opts?.liveRefresh ? 5_000 : false,
    staleTime: opts?.liveRefresh ? 0 : undefined,
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
      void qc.invalidateQueries({ queryKey: queryKeys.categoriesTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.categoriesTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useRestoreCategory = (): UseMutationResult<
  Category,
  Error,
  number
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.categories.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoriesTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const usePurgeTrashedCategory = (): UseMutationResult<
  void,
  Error,
  number
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.categories.purgeTrashed(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoriesTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
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
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
};

export const useArchiveOrder = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.orders.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
      void qc.invalidateQueries({ queryKey: ["orders", "status-counts"] });
    },
  });
};

export const useRestoreOrder = (): UseMutationResult<Order, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.orders.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
      void qc.invalidateQueries({ queryKey: ["orders", "status-counts"] });
    },
  });
};

export const usePurgeTrashedOrder = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.orders.purgeTrashed(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders() });
      void qc.invalidateQueries({ queryKey: queryKeys.ordersTrashed() });
      void qc.invalidateQueries({ queryKey: ["orders", "status-counts"] });
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

export type RbacCatalog = { permissions: RbacPermission[]; roles: RbacRole[] };

export const useRbacCatalog = (opts?: { enabled?: boolean }) =>
  useQuery<RbacCatalog, Error>({
    queryKey: queryKeys.rbacCatalog(),
    queryFn: async () => {
      const [permissions, roles] = await Promise.all([
        api.rbac.listPermissions(),
        api.rbac.listRoles(),
      ]);
      return { permissions, roles };
    },
    enabled: opts?.enabled ?? true,
  });

export type UsersListData = { items: User[]; total: number };

export const useStaffUserList = (opts?: {
  enabled?: boolean;
  listParams?: { q?: string; page?: number; limit?: number };
}): UseQueryResult<UsersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.staffUserList(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const res = await api.users.list({
        q: opts?.listParams?.q,
        page: opts?.listParams?.page,
        limit: opts?.listParams?.limit,
      });
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

/** Tài khoản đại lý (role customer) — API `/users/dealers` (products.read). */
export const useDealerUsers = (opts?: {
  enabled?: boolean;
}): UseQueryResult<User[], Error> =>
  useQuery({
    queryKey: queryKeys.dealers(),
    queryFn: () => api.users.listDealers(),
    enabled: opts?.enabled ?? true,
  });

export const useTrashedStaffUsers = (opts?: {
  enabled?: boolean;
  listParams?: { page?: number; limit?: number; q?: string };
}): UseQueryResult<UsersListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.usersTrashed(), opts?.listParams ?? null] as const,
    queryFn: async () => {
      const lp = opts?.listParams;
      const res = await api.users.listTrashed({
        page: lp?.page ?? 1,
        limit: lp?.limit ?? 25,
        q: lp?.q,
      });
      return { items: res.items, total: res.total };
    },
    enabled: opts?.enabled ?? true,
  });

export const useCreateStaffUser = (): UseMutationResult<
  User,
  Error,
  CreateUserInput
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.users.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.dealers() });
    },
  });
};

export const useUpdateStaffUser = (): UseMutationResult<
  User,
  Error,
  { id: number; input: UpdateUserInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.users.update(id, input),
    onSuccess: (u) => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.dealers() });
      qc.setQueryData(queryKeys.staffProfile(u.id), u);
    },
  });
};

export const useDeleteStaffUser = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.users.remove(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.dealers() });
      qc.removeQueries({ queryKey: queryKeys.staffProfile(id) });
    },
  });
};

export const useRestoreStaffUser = (): UseMutationResult<User, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.users.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.dealers() });
    },
  });
};

export const usePurgeTrashedStaffUser = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.users.purgeTrashed(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      void qc.invalidateQueries({ queryKey: queryKeys.dealers() });
      qc.removeQueries({ queryKey: queryKeys.staffProfile(id) });
    },
  });
};

export type PromoCodesListParams = {
  q?: string;
  page: number;
  limit: number;
};

export const usePromoCodesAdmin = (opts: {
  listParams: PromoCodesListParams;
}): UseQueryResult<{ items: PromoCode[]; total: number }, Error> =>
  useQuery({
    queryKey: [...queryKeys.promoCodes(), opts.listParams] as const,
    queryFn: async () => {
      const res = await api.promoCodes.list(opts.listParams);
      if (Array.isArray(res)) {
        return { items: res, total: res.length };
      }
      return { items: res.items, total: res.total };
    },
  });

export const useCreatePromoCode = (): UseMutationResult<
  PromoCode,
  Error,
  CreatePromoCodeInput
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.promoCodes.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.promoCodes() });
    },
  });
};

export const useUpdatePromoCode = (): UseMutationResult<
  PromoCode,
  Error,
  { id: number; input: UpdatePromoCodeInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.promoCodes.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.promoCodes() });
    },
  });
};

export const useDeletePromoCode = (): UseMutationResult<void, Error, number> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.promoCodes.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.promoCodes() });
    },
  });
};

export const useDealerSupportAdmin = (opts?: {
  enabled?: boolean;
}): UseQueryResult<DealerSupportAdminPayload, Error> =>
  useQuery({
    queryKey: queryKeys.dealerSupportAdmin(),
    queryFn: () => api.dealerSupport.adminGet(),
    enabled: opts?.enabled ?? true,
  });

export const useSaveDealerSupport = (): UseMutationResult<
  DealerSupportPublicPayload,
  Error,
  DealerSupportPublicPayload
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (merged) => api.dealerSupport.adminPut(merged),
    onSuccess: (merged) => {
      const defaults = getDealerSupportPublicPayload();
      const overrides = computeDealerSupportDiff(defaults, merged);
      qc.setQueryData<DealerSupportAdminPayload>(queryKeys.dealerSupportAdmin(), {
        defaults,
        overrides: { ...overrides },
        merged,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.dealerSupportAdmin() });
    },
  });
};

export const useResetDealerSupport = (): UseMutationResult<
  DealerSupportPublicPayload,
  Error,
  void
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.dealerSupport.adminReset(),
    onSuccess: (merged) => {
      const defaults = getDealerSupportPublicPayload();
      qc.setQueryData<DealerSupportAdminPayload>(queryKeys.dealerSupportAdmin(), {
        defaults,
        overrides: {},
        merged,
      });
      void qc.invalidateQueries({ queryKey: queryKeys.dealerSupportAdmin() });
    },
  });
};
