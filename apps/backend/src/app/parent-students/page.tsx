"use client";

import { useMemo, useState } from "react";
import {
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  GraduationCap,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
} from "@ui/lib/layout-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";

interface ParentStudentRow {
  id: string;
  parentId: string;
  studentCode: string;
  studentName: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResult {
  data: ParentStudentRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ConfirmAction =
  | { kind: "approve"; row: ParentStudentRow }
  | { kind: "reject"; row: ParentStudentRow };

const STATUS_CONFIG = {
  pending: {
    label: "Chờ duyệt",
    icon: Clock,
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400",
  },
  approved: {
    label: "Đã duyệt",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Từ chối",
    icon: XCircle,
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
  },
};

function AdminParentStudentsPageInner() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const { data, isLoading, refetch } = useQuery<ListResult>({
    queryKey: ["admin", "parent-students", statusFilter],
    queryFn: async () => {
      const qs = new URLSearchParams({ status: statusFilter, limit: "50" });
      const payload = await api.http.get<unknown>(
        `/admin/parent-students?${qs.toString()}`,
      );
      const envelope = payload as { data?: ListResult };
      return (
        envelope.data ?? {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        }
      );
    },
    staleTime: 20_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "approved" | "rejected";
    }) => {
      await api.http.patch(`/admin/parent-students/${id}/review`, { action });
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "approved" ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "parent-students"] });
      setConfirmAction(null);
    },
    onError: () => toast.error("Lỗi xử lý yêu cầu"),
  });

  const pendingCount =
    statusFilter === "pending" ? (data?.pagination.total ?? 0) : null;

  const columns = useMemo<ColumnDef<ParentStudentRow, unknown>[]>(
    () => [
      {
        id: "parent",
        header: "Phụ huynh",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="size-3.5" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.parentId.slice(0, 8)}…
            </span>
          </div>
        ),
      },
      {
        id: "student",
        header: "Học sinh",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
            <div>
              {row.original.studentName && (
                <p className="font-medium">{row.original.studentName}</p>
              )}
              <p className="font-mono text-xs text-muted-foreground">
                {row.original.studentCode}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "note",
        header: "Ghi chú",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? (
            <span className="text-xs text-muted-foreground">{v}</span>
          ) : (
            <span className="text-xs italic opacity-40">Không có</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          new Date(getValue() as string).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        enableColumnFilter: false,
        cell: ({ getValue }) => {
          const s = getValue() as ParentStudentRow["status"];
          const cfg = STATUS_CONFIG[s];
          const StatusIcon = cfg.icon;
          return (
            <Badge className={cfg.className} variant="secondary">
              <StatusIcon className="mr-1 size-3" />
              {cfg.label}
            </Badge>
          );
        },
      },
      ...(statusFilter === "pending"
        ? [
            {
              id: "actions",
              header: "Thao tác",
              enableColumnFilter: false,
              cell: ({ row }: { row: { original: ParentStudentRow } }) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 border-emerald-200 px-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400"
                    onClick={() =>
                      setConfirmAction({ kind: "approve", row: row.original })
                    }
                  >
                    <CheckCircle2 className="size-3.5" />
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 border-rose-200 px-2 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                    onClick={() =>
                      setConfirmAction({ kind: "reject", row: row.original })
                    }
                  >
                    <XCircle className="size-3.5" />
                    Từ chối
                  </Button>
                </div>
              ),
            } as ColumnDef<ParentStudentRow, unknown>,
          ]
        : []),
    ],
    [statusFilter],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <UserCheck className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Duyệt liên kết học sinh
          </TypographyH1>
          <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Xem xét và duyệt yêu cầu liên kết học sinh từ phụ huynh.
            {pendingCount != null && pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                {pendingCount} chờ duyệt
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => refetch()}
        >
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>
      </div>

      <AdminDataTable<ParentStudentRow>
        data={data?.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyLabel="Không có yêu cầu nào."
        getGlobalFilterText={(row) =>
          `${row.studentCode} ${row.studentName ?? ""} ${row.parentId}`
        }
        globalFilterPlaceholder="Tìm mã sinh viên, họ tên, ID phụ huynh…"
        filterToolbarExtra={
          <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
            <SelectTrigger className="h-9 w-40 shrink-0 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <AdminConfirmActionDialog
        open={confirmAction != null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        contentClassName={ADMIN_ALERT_DIALOG_CONTENT_CLASS}
        footerClassName="gap-2"
        icon={
          confirmAction?.kind === "approve" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <XCircle className="size-5 shrink-0 text-destructive" aria-hidden />
          )
        }
        title={
          confirmAction?.kind === "approve"
            ? "Duyệt yêu cầu liên kết?"
            : "Từ chối yêu cầu liên kết?"
        }
        description={
          confirmAction?.kind === "approve"
            ? `Duyệt liên kết học sinh «${confirmAction.row.studentCode}». Phụ huynh sẽ được xem bảng điểm sau khi duyệt.`
            : confirmAction?.kind === "reject"
              ? `Từ chối liên kết học sinh «${confirmAction.row.studentCode}». Phụ huynh sẽ thấy thông báo bị từ chối.`
              : null
        }
        confirmLabel={confirmAction?.kind === "approve" ? "Duyệt" : "Từ chối"}
        confirmDestructive={confirmAction?.kind === "reject"}
        confirmDisabled={reviewMutation.isPending}
        confirmLoading={reviewMutation.isPending}
        onConfirm={() => {
          if (!confirmAction) return;
          reviewMutation.mutate({
            id: confirmAction.row.id,
            action: confirmAction.kind === "approve" ? "approved" : "rejected",
          });
        }}
      />
    </PageSection>
  );
}

export default function AdminParentStudentsPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <AdminParentStudentsPageInner />
    </AdminPageGuard>
  );
}
