"use client";

import { Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { GuideConfirmAction } from "../types";

export interface GuidesConfirmDialogProps {
  confirmAction: GuideConfirmAction | null;
  deleteMutation: {
    isPending: boolean;
  };
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  contentClassName?: string;
}

export function GuidesConfirmDialog({
  confirmAction,
  deleteMutation,
  onOpenChange,
  onConfirm,
  contentClassName,
}: GuidesConfirmDialogProps) {
  if (!confirmAction) return null;

  const { kind, row } = confirmAction;

  if (kind === "delete" && row) {
    return (
      <AdminConfirmActionDialog
        open={true}
        onOpenChange={onOpenChange}
        contentClassName={contentClassName}
        footerClassName="gap-2"
        icon={<Trash2 className="size-5 shrink-0 text-destructive" />}
        title="Xóa nhóm hướng dẫn?"
        description={`Xóa nhóm hướng dẫn <strong>${row.sectionKey}</strong>? Thao tác không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmDestructive
        confirmDisabled={deleteMutation.isPending}
        confirmLoading={deleteMutation.isPending}
        onConfirm={() => {
          void onConfirm();
        }}
      />
    );
  }

  return null;
}
