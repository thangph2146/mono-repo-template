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
  type Category,
  type CategoryUsage,
  type ChangePasswordInput,
  type CreateCategoryInput,
  type CreateUserInput,
  type RbacPermission,
  type RbacRole,
  type UpdateCategoryInput,
  type UpdateProfileInput,
  type UpdateUserInput,
  type User,
} from "@/lib/api";

export const queryKeys = {
  categories: () => ["categories"] as const,
  categoriesTrashed: () => ["categories", "trashed"] as const,
  categoryUsage: () => ["categories", "usage"] as const,
  staffProfile: (id: string | number) => ["users", "staff-profile", id] as const,
  staffUserList: () => ["users", "staff-list"] as const,
  usersTrashed: () => ["users", "trashed"] as const,
  rbacCatalog: () => ["rbac", "catalog"] as const,
};

export type CategoriesListData = { items: Category[]; total: number };
export type UsersListData = { items: User[]; total: number };
export type RbacCatalog = { permissions: RbacPermission[]; roles: RbacRole[] };

export const useCategories = (opts?: { enabled?: boolean }) =>
  useQuery<Category[], Error>({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const res = await api.categories.list();
      return Array.isArray(res) ? res : res.items;
    },
    enabled: opts?.enabled ?? true,
  });

export const useCategoriesAdmin = (opts?: {
  enabled?: boolean;
  listParams?: { q?: string; page?: number; limit?: number; activeOnly?: boolean };
}): UseQueryResult<CategoriesListData, Error> =>
  useQuery({
    queryKey: [...queryKeys.categories(), "admin", opts?.listParams ?? null] as const,
    queryFn: async () => {
      const res = await api.categories.list({
        q: opts?.listParams?.q,
        page: opts?.listParams?.page,
        limit: opts?.listParams?.limit,
        activeOnly: opts?.listParams?.activeOnly,
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
  { id: string | number; input: UpdateCategoryInput }
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => api.categories.update(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.categoryUsage() });
    },
  });
};

export const useDeleteCategory = (): UseMutationResult<
  void,
  Error,
  string | number
> => {
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
  string | number
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
  string | number
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

export const useStaffProfile = (userId: string | number | null | undefined) =>
  useQuery<User, Error>({
    queryKey: queryKeys.staffProfile(userId ?? "missing"),
    queryFn: () => api.users.get(userId as string | number),
    enabled:
      (typeof userId === "string" && userId.trim().length > 0) ||
      (typeof userId === "number" && userId > 0),
  });

export const useUpdateStaffProfile = (): UseMutationResult<
  User,
  Error,
  { id: string | number; input: UpdateProfileInput }
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
  { id: string | number; input: ChangePasswordInput }
> => {
  return useMutation({
    mutationFn: ({ id, input }) => api.users.changePassword(id, input),
  });
};

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
      return { items: res.items, total: res.total };
    },
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
    },
  });
};

export const usePurgeTrashedStaffUser = (): UseMutationResult<
  void,
  Error,
  number
> => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.users.purgeTrashed(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.staffUserList() });
      void qc.invalidateQueries({ queryKey: queryKeys.usersTrashed() });
      qc.removeQueries({ queryKey: queryKeys.staffProfile(id) });
    },
  });
};
