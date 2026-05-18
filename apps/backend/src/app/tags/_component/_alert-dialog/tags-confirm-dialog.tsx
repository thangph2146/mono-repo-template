"use client";

import { ArchiveRestore, Trash2, AlertTriangle } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { ADMIN_ALERT_DIALOG_CONTENT_CLASS } from "@ui/lib/layout-shell";
import type { TagRow } from "../types";

export interface TagsConfirmDialogProps {
  deleteTarget: TagRow | null;
  setDeleteTarget: (target: TagRow | null) => void;
  onDeleteConfirm: () => void;
  restoreTarget: TagRow | null;
  setRestoreTarget: (target: TagRow | null) => void;
  onRestoreConfirm: () => void;
  purgeTarget: TagRow | null;
  setPurgeTarget: (target: TagRow | null) => void;
  onPurgeConfirm: () => void;
  bulkDeleteCount: number;
  setBulkDeleteTarget: (count: number) => void;
  onBulkDeleteConfirm: () => void;
}

export function TagsConfirmDialog({
  deleteTarget,
  setDeleteTarget,
  onDeleteConfirm,
  restoreTarget,
  setRestoreTarget,
  onRestoreConfirm,
  purgeTarget,
  setPurgeTarget,
  onPurgeConfirm,
  bulkDeleteCount,
  setBulkDeleteTarget,
  onBulkDeleteConfirm,
}: TagsConfirmDialogProps) {
  return (
    <>
      <AdminConfirmActionDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<Trash2 className="size-5 shrink-0 text-destructive" />}
        title="Đưa thẻ vào thùng rác?"
        description={
          deleteTarget ? (
            <>
              Thẻ <strong className="text-foreground">{deleteTarget.name}</strong> (slug{" "}
              <span className="font-mono">{deleteTarget.slug}</span>) sẽ được ẩn khỏi danh sách
              đang dùng.
            </>
          ) : null
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        onConfirm={onDeleteConfirm}
      />

      <AdminConfirmActionDialog
        open={restoreTarget != null}
        onOpenChange={(open) => {
          if (!open) setRestoreTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<ArchiveRestore className="size-5 shrink-0 text-primary" />}
        title="Khôi phục thẻ?"
        description={
          restoreTarget ? (
            <>
              Đưa thẻ <strong className="text-foreground">{restoreTarget.name}</strong> trở lại
              danh sách hoạt động.
            </>
          ) : null
        }
        confirmLabel="Khôi phục"
        onConfirm={onRestoreConfirm}
      />

      <AdminConfirmActionDialog
        open={purgeTarget != null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        titleClassName="flex items-center gap-2 text-left text-destructive"
        icon={<Trash2 className="size-5 shrink-0" />}
        title="Xóa vĩnh viễn thẻ?"
        description={
          purgeTarget ? (
            <>
              Thẻ <strong className="text-foreground">{purgeTarget.name}</strong> sẽ bị xóa khỏi
              hệ thống và không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        onConfirm={onPurgeConfirm}
      />

      <AdminConfirmActionDialog
        open={bulkDeleteCount > 0}
        onOpenChange={(open) => {
          if (!open) setBulkDeleteTarget(0);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        icon={<AlertTriangle className="size-5 shrink-0 text-destructive" />}
        title="Xóa tạm thẻ đã chọn?"
        description={
          <>
            Bạn sắp đưa <strong className="text-foreground">{bulkDeleteCount} thẻ</strong> vào
            thùng rác. Các thẻ này sẽ bị ẩn khỏi danh sách đang dùng.
          </>
        }
        confirmLabel={`Xóa tạm ${bulkDeleteCount} thẻ`}
        confirmDestructive
        onConfirm={onBulkDeleteConfirm}
      />
    </>
  );
}
