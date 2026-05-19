import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { ADMIN_ALERT_DIALOG_CONTENT_CLASS } from "@ui/lib/layout-shell";
import type { ContactRequest } from "../types";

interface ContactConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "delete" | "restore" | "purge";
  target: ContactRequest | null;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

interface ContactBulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "delete" | "restore" | "purge";
  count: number;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function ContactConfirmDialog(props: ContactConfirmDialogProps) {
  const { open, onOpenChange, action, target, onConfirm, loading } = props;

  if (action === "delete") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Archive className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Đưa yêu cầu vào thùng rác?"
        description={
          target ? (
            <>
              Yêu cầu từ <strong>{target.name}</strong> ({target.email}) sẽ không hiển thị trong danh sách. Có thể khôi phục trong tab Thùng rác.
            </>
          ) : null
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  if (action === "purge") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Trash2 className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Xóa vĩnh viễn yêu cầu?"
        description={
          target ? (
            <>
              Yêu cầu từ <strong>{target.name}</strong> ({target.email}) sẽ bị xoá khỏi cơ sở dữ liệu. Không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  if (action === "restore") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={
          <ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />
        }
        title="Khôi phục yêu cầu?"
        description={
          target ? (
            <>
              Đưa yêu cầu từ <strong>{target.name}</strong> ({target.email}) trở lại danh sách.
            </>
          ) : null
        }
        confirmLabel="Khôi phục"
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  return null;
}

export function ContactBulkConfirmDialog(props: ContactBulkConfirmDialogProps) {
  const { open, onOpenChange, action, count, onConfirm, loading } = props;

  if (action === "delete") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Archive className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Đưa yêu cầu vào thùng rác?"
        description={
          <>
            <strong>{count}</strong> yêu cầu sẽ không hiển thị trong danh sách. Có thể khôi phục trong tab Thùng rác.
          </>
        }
        confirmLabel="Xóa tạm"
        confirmDestructive
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  if (action === "purge") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Trash2 className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Xóa vĩnh viễn yêu cầu?"
        description={
          <>
            <strong>{count}</strong> yêu cầu sẽ bị xoá khỏi cơ sở dữ liệu. Không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa vĩnh viễn"
        confirmDestructive
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  if (action === "restore") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={
          <ArchiveRestore className="size-5 shrink-0 text-primary" aria-hidden />
        }
        title="Khôi phục yêu cầu?"
        description={
          <>
            Đưa <strong>{count}</strong> yêu cầu trở lại danh sách.
          </>
        }
        confirmLabel="Khôi phục"
        confirmDisabled={loading}
        confirmLoading={loading}
        onConfirm={() => void onConfirm()}
      />
    );
  }

  return null;
}
