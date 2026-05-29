"use client"

import type { UseMutationResult } from "@tanstack/react-query"
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog"
import type { SeoMetaConfirmAction, SeoMetaRow } from "../types"

export interface SeoMetasConfirmDialogProps {
  confirmAction: SeoMetaConfirmAction | null
  deleteMutation: UseMutationResult<unknown, Error, string>
  restoreMutation: UseMutationResult<unknown, Error, string>
  purgeMutation: UseMutationResult<unknown, Error, string>
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  contentClassName?: string
}

export function SeoMetasConfirmDialog({
  confirmAction,
  deleteMutation,
  restoreMutation,
  purgeMutation,
  onOpenChange,
  onConfirm,
  contentClassName,
}: SeoMetasConfirmDialogProps) {
  if (!confirmAction) return null

  const kind = confirmAction.kind
  const row: SeoMetaRow = confirmAction.row
  const title = `SEO: ${row.page}`
  const descriptions: Record<string, string> = {
    delete: `Đưa SEO metadata của "${row.page}" vào thùng rác?`,
    restore: `Khôi phục SEO metadata của "${row.page}"?`,
    purge: `Xóa vĩnh viễn SEO metadata của "${row.page}"? Hành động này không thể hoàn tác.`,
  }
  const confirmLabels: Record<string, string> = {
    delete: "Xóa tạm",
    restore: "Khôi phục",
    purge: "Xóa vĩnh viễn",
  }

  return (
    <AdminConfirmActionDialog
      open={true}
      onOpenChange={onOpenChange}
      title={title}
      description={descriptions[kind]}
      confirmLabel={confirmLabels[kind]}
      confirmDestructive={kind === "delete" || kind === "purge"}
      onConfirm={onConfirm}
      confirmLoading={
        kind === "delete"
          ? deleteMutation.isPending
          : kind === "restore"
            ? restoreMutation.isPending
            : purgeMutation.isPending
      }
      contentClassName={contentClassName}
    />
  )
}
