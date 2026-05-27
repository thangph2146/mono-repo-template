"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function useReviewParentStudentMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approved" | "rejected" }) => {
      await api.http.patch(`/admin/parent-students/${id}/review`, { action });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu");
      queryClient.invalidateQueries({ queryKey: ["admin", "parent-students"] });
      onSuccess?.();
    },
    onError: () => toast.error("Lỗi xử lý yêu cầu"),
  });
}
