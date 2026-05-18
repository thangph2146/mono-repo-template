import type { UseMutationResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import type { TagRow } from "../types";

export function useHandleDelete(
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>,
) {
  return useCallback(
    async (row: TagRow) => {
      await toast.promise(deleteMutation.mutateAsync(row.id), {
        loading: `Đang xóa tạm «${row.name}»...`,
        success: `Đã đưa «${row.name}» vào thùng rác`,
        error: (error: unknown) =>
          error instanceof Error ? error.message : "Không xóa được thẻ",
      });
    },
    [deleteMutation],
  );
}

export function useHandleRestore(
  restoreMutation: UseMutationResult<unknown, Error, string, unknown>,
) {
  return useCallback(
    async (row: TagRow) => {
      await toast.promise(restoreMutation.mutateAsync(row.id), {
        loading: `Đang khôi phục «${row.name}»...`,
        success: `Đã khôi phục «${row.name}»`,
        error: (error: unknown) =>
          error instanceof Error ? error.message : "Không khôi phục được thẻ",
      });
    },
    [restoreMutation],
  );
}

export function useHandlePurge(
  purgeMutation: UseMutationResult<unknown, Error, string, unknown>,
) {
  return useCallback(
    async (row: TagRow) => {
      await toast.promise(purgeMutation.mutateAsync(row.id), {
        loading: `Đang xóa vĩnh viễn «${row.name}»...`,
        success: `Đã xóa vĩnh viễn «${row.name}»`,
        error: (error: unknown) =>
          error instanceof Error ? error.message : "Không xóa hẳn được thẻ",
      });
    },
    [purgeMutation],
  );
}
