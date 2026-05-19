import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@workspace/api-client";
import type { StoreSyncSdk } from "@workspace/api-client";
import { queryKeys } from "@/hooks/queries";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { api } from "@/lib/api";

export type UsersListData = { items: User[]; total: number };

export interface UseStaffMutationsProps {
  api: StoreSyncSdk;
}

export function useStaffMutations({ api: apiClient }: UseStaffMutationsProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: { email: string; fullName: string; password: string; isActive: boolean; roleCodes: string[] }) => {
      return apiClient.users.create({
        email: input.email,
        fullName: input.fullName,
        password: input.password,
        isActive: input.isActive,
        roleCodes: input.roleCodes,
      });
    },
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
    mutationFn: async ({ id, input }: { id: string; input: { fullName: string; isActive: boolean; roleCodes: string[]; password?: string } }) => {
      return apiClient.users.update(id, {
        fullName: input.fullName,
        isActive: input.isActive,
        password: input.password,
        roleCodes: input.roleCodes,
      });
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.staffUserList() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.staffProfile(variables.id) }),
      ]);
      toast.success("Đã cập nhật nhân sự");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Không lưu được");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.users.remove(id),
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
    mutationFn: async (id: string) => apiClient.users.restore(id),
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
    mutationFn: async (id: string) => apiClient.users.purgeTrashed(id),
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
