"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { PostConfirmAction } from "../types";

export interface PostsConfirmDialogProps {
  confirmAction: PostConfirmAction | null;
  deleteMutation: {
    isPending: boolean;
  };
  restoreMutation: {
    isPending: boolean;
  };
  purgeMutation: {
    isPending: boolean;
  };
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contentClassName?: string;
}

export function PostsConfirmDialog({
  confirmAction,
  deleteMutation,
  restoreMutation,
  purgeMutation,
  onOpenChange,
  onConfirm,
  contentClassName,
}: PostsConfirmDialogProps) {
  if (!confirmAction) return null;

  const { kind, row } = confirmAction;

  return (
    <AdminConfirmActionDialog
      open={true}
      onOpenChange={onOpenChange}
      contentClassName={contentClassName}
      footerClassName="gap-2"
      icon={
        kind === "delete" ? (
          <Archive className="size-5 shrink-0 text-destructive" />
        ) : kind === "restore" ? (
          <ArchiveRestore className="size-5 shrink-0 text-primary" />
        ) : kind === "purge" ? (
          <Trash2 className="size-5 shrink-0 text-destructive" />
        ) : null
      }
      title={
        kind === "delete"
          ? "Đưa bài viết vào thùng rác?"
          : kind === "restore"
            ? "Khôi phục bài viết?"
            : kind === "purge"
              ? "Xóa vĩnh viễn bài viết?"
              : ""
      }
      description={
        kind === "delete"
          ? `«${row.title}» sẽ bị xóa tạm. Có thể khôi phục từ tab Thùng rác.`
          : kind === "restore"
            ? `Khôi phục «${row.title}» về danh sách đang hoạt động.`
            : kind === "purge"
              ? `«${row.title}» sẽ bị xóa khỏi cơ sở dữ liệu và không thể hoàn tác.`
              : null
      }
      confirmLabel={
        kind === "delete"
          ? "Xóa tạm"
          : kind === "restore"
            ? "Khôi phục"
            : kind === "purge"
              ? "Xóa vĩnh viễn"
              : "Xác nhận"
      }
      confirmDestructive={kind === "delete" || kind === "purge"}
      confirmDisabled={
        deleteMutation.isPending || restoreMutation.isPending || purgeMutation.isPending
      }
      confirmLoading={
        kind === "delete"
          ? deleteMutation.isPending
          : kind === "restore"
            ? restoreMutation.isPending
            : kind === "purge"
              ? purgeMutation.isPending
              : false
      }
      onConfirm={() => {
        void onConfirm();
      }}
    />
  );
}
