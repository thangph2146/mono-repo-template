"use client";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import type { TemplateConfirmAction } from "../types";
export function TemplatesConfirmDialog({ confirmAction, deleteMutation, restoreMutation, purgeMutation, onOpenChange, onConfirm, contentClassName }: {
  confirmAction: TemplateConfirmAction | null; deleteMutation: { isPending: boolean }; restoreMutation: { isPending: boolean }; purgeMutation: { isPending: boolean }; onOpenChange: (o: boolean) => void; onConfirm: () => void; contentClassName?: string;
}) {
  if (!confirmAction) return null; const { kind, row } = confirmAction;
  return (<AdminConfirmActionDialog open onOpenChange={onOpenChange} contentClassName={contentClassName} footerClassName="gap-2" icon={kind === "delete" ? <Archive className="size-5 shrink-0 text-destructive" /> : kind === "restore" ? <ArchiveRestore className="size-5 shrink-0 text-primary" /> : <Trash2 className="size-5 shrink-0 text-destructive" />} title={kind === "delete" ? "Xóa mẫu?" : kind === "restore" ? "Khôi phục mẫu?" : "Xóa vĩnh viễn?"} description={kind === "delete" ? `«${row.name}» vào thùng rác.` : kind === "restore" ? `Khôi phục «${row.name}».` : `Xóa vĩnh viễn «${row.name}». Không thể hoàn tác.`} confirmLabel={kind === "delete" ? "Xóa tạm" : kind === "restore" ? "Khôi phục" : "Xóa vĩnh viễn"} confirmDestructive={kind !== "restore"} confirmDisabled={deleteMutation.isPending || restoreMutation.isPending || purgeMutation.isPending} confirmLoading={kind === "delete" ? deleteMutation.isPending : kind === "restore" ? restoreMutation.isPending : purgeMutation.isPending} onConfirm={() => { void onConfirm(); }} />);
}
