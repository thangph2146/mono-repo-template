"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  ContactRequest,
  CreateContactRequestInput,
  UpdateContactRequestInput,
} from "@workspace/api-client";

export const useCreateContactRequest = (): UseMutationResult<
  ContactRequest,
  Error,
  CreateContactRequestInput
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateContactRequestInput) => {
      return api.contactRequests.create(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã tạo yêu cầu liên hệ mới");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể tạo yêu cầu liên hệ");
    },
  });
};

export const useUpdateContactRequest = (): UseMutationResult<
  ContactRequest,
  Error,
  { id: string | number; input: UpdateContactRequestInput }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }) => {
      return api.contactRequests.update(id, input);
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["contact-requests", data.id] });
      toast.success("Đã cập nhật yêu cầu liên hệ");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể cập nhật yêu cầu liên hệ");
    },
  });
};

export const useDeleteContactRequest = (): UseMutationResult<
  void,
  Error,
  string | number
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      return api.contactRequests.remove(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã xóa yêu cầu liên hệ");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể xóa yêu cầu liên hệ");
    },
  });
};

export const useRestoreContactRequest = (): UseMutationResult<
  ContactRequest,
  Error,
  string | number
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      return api.contactRequests.restore(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã khôi phục yêu cầu liên hệ");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể khôi phục yêu cầu liên hệ");
    },
  });
};

export const usePurgeContactRequest = (): UseMutationResult<
  void,
  Error,
  string | number
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      return api.contactRequests.hardDelete(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã xóa vĩnh viễn yêu cầu liên hệ");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể xóa vĩnh viễn yêu cầu liên hệ");
    },
  });
};

export const useBulkDeleteContactRequest = (): UseMutationResult<
  { affected: number; message: string },
  Error,
  string[]
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return api.contactRequests.bulkDelete(ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã xóa các yêu cầu liên hệ được chọn");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể xóa các yêu cầu liên hệ");
    },
  });
};

export const useBulkRestoreContactRequest = (): UseMutationResult<
  { affected: number; message: string },
  Error,
  string[]
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return api.contactRequests.bulkRestore(ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã khôi phục các yêu cầu liên hệ được chọn");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể khôi phục các yêu cầu liên hệ");
    },
  });
};

export const useBulkPurgeContactRequest = (): UseMutationResult<
  { affected: number; message: string },
  Error,
  string[]
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      return api.contactRequests.bulkHardDelete(ids);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contact-requests"] });
      toast.success("Đã xóa vĩnh viễn các yêu cầu liên hệ được chọn");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể xóa vĩnh viễn các yêu cầu liên hệ");
    },
  });
};
