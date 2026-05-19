"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ColumnFiltersState,
  RowSelectionState,
} from "@tanstack/react-table";
import { UserCheck, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { PageSection } from "@ui/components/layout";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_ALERT_DIALOG_CONTENT_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
} from "@ui/lib/layout-shell";
import { AdminConfirmActionDialog } from "@/components/admin-confirm-action-dialog";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { ParentStudentTable } from "./_component/_table";
import { useReviewParentStudentMutation } from "./_component/_query";
import { getParentStudentsColumns } from "./_component/columns";
import type { ParentStudent } from "./_component/types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

interface ListResult {
  data: ParentStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type ConfirmAction =
  | { kind: "approve"; row: ParentStudent }
  | { kind: "reject"; row: ParentStudent };

function buildParentStudentsFilterQuery(
  filters: { id: string; value: unknown }[]
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of filters) {
    const { value } = filter;
    if (value === undefined || value === null || value === "") continue;

    if (filter.id === "status") {
      const v = String(value).trim();
      if (v) query.status = v;
    } else if (filter.id === "createdAt") {
      const v = String(value).trim();
      if (v) query.createdAt = v;
    }
  }
  return query;
}

function AdminParentStudentsPageInner() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<RowSelectionState>({});
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const debouncedQ = useDebouncedValue(globalFilter, 300);

  const columnFilterQuery = useMemo(
    () => buildParentStudentsFilterQuery(columnFilters),
    [columnFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [columnFilters, debouncedQ, pageSize]);

  useEffect(() => {
    setSelectedRowIds({});
  }, [columnFilters]);

  const { data, isLoading, isFetching, refetch } = useQuery<ListResult>({
    queryKey: ["admin", "parent-students", page, pageSize, debouncedQ, columnFilterQuery],
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (debouncedQ.trim()) qs.set("search", debouncedQ.trim());
      if (columnFilterQuery.status) qs.set("status", columnFilterQuery.status);
      if (columnFilterQuery.createdAt) qs.set("createdAt", columnFilterQuery.createdAt);

      const payload = await api.http.get<unknown>(
        `/admin/parent-students?${qs.toString()}`,
      );
      const envelope = payload as { data?: ListResult };
      return (
        envelope.data ?? {
          data: [],
          pagination: { page: 1, limit: pageSize, total: 0, totalPages: 0 },
        }
      );
    },
    staleTime: 20_000,
  });

  const reviewMutation = useReviewParentStudentMutation(() => setConfirmAction(null));

  const handleColumnFiltersChange = useCallback<
    (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void
  >(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, []);

  const columns = useMemo(
    () =>
      getParentStudentsColumns({
        onApprove: (row) => setConfirmAction({ kind: "approve", row }),
        onReject: (row) => setConfirmAction({ kind: "reject", row }),
      }),
    [],
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
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => refetch()}
        >
          <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
          Làm mới
        </Button>
      </div>

      <ParentStudentTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        columnFilters={columnFilters}
        onColumnFiltersChange={handleColumnFiltersChange}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        selectedRowIds={selectedRowIds}
        onSelectedRowIdsChange={setSelectedRowIds}
        page={page}
        pageSize={pageSize}
        total={data?.pagination.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRefresh={() => refetch()}
        onClearFilters={clearFilters}
        onBulkApprove={async (rows) => {
          for (const row of rows) {
            await reviewMutation.mutateAsync({
              id: row.id,
              action: "approved",
            });
          }
        }}
        onBulkReject={async (rows) => {
          for (const row of rows) {
            await reviewMutation.mutateAsync({
              id: row.id,
              action: "rejected",
            });
          }
        }}
        isFetching={isFetching}
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
