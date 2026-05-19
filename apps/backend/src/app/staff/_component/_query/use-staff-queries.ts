import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@workspace/api-client";
import { api } from "@/lib/api";
import { queryKeys } from "@/hooks/queries";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";

export type UsersListData = { items: User[]; total: number };

export function useStaffMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      fullName: string;
      password: string;
      isActive: boolean;
      roleCodes?: string[];
    }) => api.http.post("/admin/users", data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
      ]);
      toast.success("Đã tạo tài khoản");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không tạo được user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: { fullName: string; isActive: boolean; roleCodes: string[]; password?: string } }) =>
      api.http.put(`/admin/users/${id}`, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
      ]);
      toast.success("Đã cập nhật nhân sự");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không lưu được");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/users/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersTrashed() }),
      ]);
      toast.success("Đã đưa tài khoản vào thùng rác");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không xoá được");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => api.http.post(`/admin/users/${id}/restore`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersTrashed() }),
      ]);
      toast.success("Đã khôi phục tài khoản");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không khôi phục được");
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/users/${id}/hard-delete`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersTrashed() }),
      ]);
      toast.success("Đã xóa vĩnh viễn tài khoản");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không xóa vĩnh viễn được");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/users/bulk", input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.usersTrashed() }),
      ]);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    restoreMutation,
    purgeMutation,
    bulkMutation,
  };
}
