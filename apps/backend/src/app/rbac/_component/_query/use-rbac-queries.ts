"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { CreateRoleInput, UpdateRoleInput } from "../types";

// Query keys
export const rbacQueryKeys = {
  all: ["rbac"] as const,
  catalog: () => [...rbacQueryKeys.all, "catalog"] as const,
};

// Shared hook from @/hooks/queries
// Note: Assuming useRbacCatalog exists in shared hooks
// If not, we'll implement it here

export function useRbacCatalog() {
  return useQuery({
    queryKey: rbacQueryKeys.catalog(),
    queryFn: async () => {
      const [roles, permissions] = await Promise.all([
        api.rbac.listRoles(),
        api.rbac.listPermissions(),
      ]);
      return { roles, permissions };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      // TODO: Implement API call when endpoint is available
      // return api.rbac.createRole(data);
      console.log("Create role:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.catalog() });
      toast.success("Đã tạo vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo vai trò: ${error.message}`);
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleInput }) => {
      // TODO: Implement API call when endpoint is available
      // return api.rbac.updateRole(id, data);
      console.log("Update role:", id, data);
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.catalog() });
      toast.success("Đã cập nhật vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật vai trò: ${error.message}`);
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // TODO: Implement API call when endpoint is available
      // return api.rbac.deleteRole(id);
      console.log("Delete role:", id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.catalog() });
      toast.success("Đã xóa vai trò thành công");
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa vai trò: ${error.message}`);
    },
  });
}
