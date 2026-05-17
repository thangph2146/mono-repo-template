import type { UseMutationResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import type { PostConfirmAction, PostListRow } from "../types";

export interface UsePostsActionsProps {
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>;
  restoreMutation: UseMutationResult<PostListRow, Error, string, unknown>;
  purgeMutation: UseMutationResult<unknown, Error, string, unknown>;
  setConfirmAction: (action: PostConfirmAction | null) => void;
}

export function useHandleConfirmActionWithAction(
  deleteMutation: UseMutationResult<unknown, Error, string, unknown>,
  restoreMutation: UseMutationResult<PostListRow, Error, string, unknown>,
  purgeMutation: UseMutationResult<unknown, Error, string, unknown>,
  setConfirmAction: (action: PostConfirmAction | null) => void
) {
  return useCallback(async (confirmAction: PostConfirmAction): Promise<void> => {
    const { kind, row } = confirmAction;
    try {
      if (kind === "delete") {
        await deleteMutation.mutateAsync(row.id);
        toast.success(`Đã đưa «${row.title}» vào thùng rác`);
      } else if (kind === "restore") {
        await restoreMutation.mutateAsync(row.id);
        toast.success(`Đã khôi phục «${row.title}»`);
      } else {
        await purgeMutation.mutateAsync(row.id);
        toast.success(`Đã xóa vĩnh viễn «${row.title}»`);
      }
      setConfirmAction(null);
    } catch (error) {
      const fallback =
        kind === "delete"
          ? "Không xóa được bài viết"
          : kind === "restore"
            ? "Không khôi phục được bài viết"
            : "Không xóa hẳn được bài viết";
      toast.error(error instanceof Error ? error.message : fallback);
    }
  }, [deleteMutation, purgeMutation, restoreMutation, setConfirmAction]);
}
