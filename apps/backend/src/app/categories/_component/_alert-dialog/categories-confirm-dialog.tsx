"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { CategoryConfirmAction } from "../types";

export interface CategoriesConfirmDialogProps {
  confirmAction: CategoryConfirmAction | null;
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

export function CategoriesConfirmDialog({
  confirmAction,
  deleteMutation,
  restoreMutation,
  purgeMutation,
  onOpenChange,
  onConfirm,
  contentClassName,
}: CategoriesConfirmDialogProps) {
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
          ? "Đưa danh mục vào thùng rác?"
          : kind === "restore"
            ? "Khôi phục danh mục?"
            : kind === "purge"
              ? "Xóa vĩnh viễn danh mục?"
              : ""
      }
      description={
        kind === "delete"
          ? `«${row.name}» (slug \`${row.slug}\`) sẽ ẩn khỏi hệ thống cho đến khi khôi phục.`
          : kind === "restore"
            ? `Đưa «${row.name}» trở lại danh sách đang hoạt động.`
            : kind === "purge"
              ? `«${row.name}» (slug \`${row.slug}\`) sẽ bị xoá khỏi cơ sở dữ liệu. Không thể hoàn tác.`
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
