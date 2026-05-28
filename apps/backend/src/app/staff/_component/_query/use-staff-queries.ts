import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateUserInput, StoreSyncSdk, UpdateUserInput } from "@workspace/api-client";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { queryKeys } from "@/hooks/queries";

type CreateStaffInput = Pick<
  CreateUserInput,
  "email" | "fullName" | "password" | "isActive" | "roleCodes"
>;

type UpdateStaffInput = Pick<
  UpdateUserInput,
  "fullName" | "password" | "isActive" | "roleCodes" | "avatar"
>;

export interface UseStaffMutationsProps {
  api: StoreSyncSdk;
}

export function useStaffMutations({ api: apiClient }: UseStaffMutationsProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (input: CreateStaffInput) => {
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
    mutationFn: async ({ id, input }: { id: string; input: UpdateStaffInput }) => {
      return apiClient.users.update(id, {
        fullName: input.fullName,
        isActive: input.isActive,
        password: input.password,
        roleCodes: input.roleCodes,
        avatar: input.avatar,
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
