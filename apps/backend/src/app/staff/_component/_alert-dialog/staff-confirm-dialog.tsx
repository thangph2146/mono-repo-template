import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { ADMIN_ALERT_DIALOG_CONTENT_CLASS } from "@ui/lib/layout-shell";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { StaffRow } from "../types";

interface StaffConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "delete" | "restore" | "purge";
  target: StaffRow | null;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

interface StaffBulkConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "delete" | "restore" | "purge";
  count: number;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
}

export function StaffConfirmDialog(props: StaffConfirmDialogProps) {
  const { open, onOpenChange, action, target, onConfirm, loading } = props;

  if (action === "delete") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Archive className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Đưa tài khoản vào thùng rác?"
        description={
          target ? (
            <>
              <strong>{target.fullName}</strong> ({target.email}) sẽ không
              đăng nhập được. Có thể khôi phục trong tab Thùng rác.
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
        title="Xóa vĩnh viễn tài khoản?"
        description={
          target ? (
            <>
              Tài khoản <strong>{target.fullName}</strong> ({target.email}) sẽ
              bị xoá khỏi cơ sở dữ liệu. Các dữ liệu liên quan sẽ được gỡ liên kết khỏi
              tài khoản này. Không thể hoàn tác.
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
        title="Khôi phục tài khoản?"
        description={
          target ? (
            <>
              Đưa <strong>{target.fullName}</strong> ({target.email}) trở lại
              hoạt động.
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

export function StaffBulkConfirmDialog(props: StaffBulkConfirmDialogProps) {
  const { open, onOpenChange, action, count, onConfirm, loading } = props;

  if (action === "delete") {
    return (
      <AdminConfirmActionDialog
        open={open}
        onOpenChange={onOpenChange}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={<Archive className="size-5 shrink-0 text-destructive" aria-hidden />}
        title="Đưa tài khoản vào thùng rác?"
        description={
          <>
            <strong>{count}</strong> tài khoản sẽ không đăng nhập được. Có thể
            khôi phục trong tab Thùng rác.
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
        title="Xóa vĩnh viễn tài khoản?"
        description={
          <>
            <strong>{count}</strong> tài khoản sẽ bị xoá khỏi cơ sở dữ liệu. Các
            dữ liệu liên quan sẽ được gỡ liên kết. Không thể hoàn tác.
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
        title="Khôi phục tài khoản?"
        description={
          <>
            Đưa <strong>{count}</strong> tài khoản trở lại hoạt động.
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
