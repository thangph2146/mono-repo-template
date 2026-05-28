"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { LocationConfirmAction } from "../types";

export interface LocationsConfirmDialogProps {
  confirmAction: LocationConfirmAction | null;
  deleteMutation: { isPending: boolean };
  restoreMutation: { isPending: boolean };
  purgeMutation: { isPending: boolean };
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contentClassName?: string;
}

export function LocationsConfirmDialog({
  confirmAction,
  deleteMutation,
  restoreMutation,
  purgeMutation,
  onOpenChange,
  onConfirm,
  contentClassName,
}: LocationsConfirmDialogProps) {
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
        ) : (
          <Trash2 className="size-5 shrink-0 text-destructive" />
        )
      }
      title={
        kind === "delete"
          ? "Đưa địa điểm vào thùng rác?"
          : kind === "restore"
            ? "Khôi phục địa điểm?"
            : "Xóa vĩnh viễn địa điểm?"
      }
      description={
        kind === "delete"
          ? `«${row.name || row.mapUrl}» sẽ ẩn khỏi hệ thống cho đến khi khôi phục.`
          : kind === "restore"
            ? `Đưa «${row.name || row.mapUrl}» trở lại danh sách đang hoạt động.`
            : `«${row.name || row.mapUrl}» sẽ bị xoá khỏi cơ sở dữ liệu. Không thể hoàn tác.`
      }
      confirmLabel={
        kind === "delete" ? "Xóa tạm" : kind === "restore" ? "Khôi phục" : "Xóa vĩnh viễn"
      }
      confirmDestructive={kind === "delete" || kind === "purge"}
      confirmDisabled={deleteMutation.isPending || restoreMutation.isPending || purgeMutation.isPending}
      confirmLoading={
        kind === "delete" ? deleteMutation.isPending : kind === "restore" ? restoreMutation.isPending : purgeMutation.isPending
      }
      onConfirm={() => { void onConfirm(); }}
    />
  );
}
