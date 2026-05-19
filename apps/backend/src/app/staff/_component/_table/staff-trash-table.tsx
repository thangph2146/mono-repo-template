import type { ColumnFiltersState, RowSelectionState, OnChangeFn } from "@tanstack/react-table";
import { FilterX, RefreshCw } from "lucide-react";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { getTrashColumns } from "../columns";
import type { User } from "@/lib/api";
import { cn } from "@ui/lib/utils";

interface StaffTrashTableProps {
  data: User[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  selectedRowIds: RowSelectionState;
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>;
  onRestore: (user: User) => void;
  onPurge: (user: User) => void;
  busy: boolean;
  onBulkRestore: (ids: string[]) => void;
  onBulkPurge: (ids: string[]) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
}

export function StaffTrashTable(props: StaffTrashTableProps) {
  const {
    data,
    isLoading,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    selectedRowIds,
    onSelectedRowIdsChange,
    onRestore,
    onPurge,
    busy,
    onBulkRestore,
    onBulkPurge,
    onClearFilters,
    onRefresh,
  } = props;

  const columns = getTrashColumns({ onRestore, onPurge, busy });

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptySummary="Thùng rác trống hoặc không khớp tìm kiếm."
      itemLabel="tài khoản"
    />
  );

  return (
    <AdminDataTable<User>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
      defaultExpandedAll={false}
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo email, họ tên, SĐT (API)…"
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-staff-restore",
          label: "Khôi phục đã chọn",
          onAction: async (rows) => {
            const ids = rows.map((u) => String(u.id));
            if (!ids.length) return;
            await onBulkRestore(ids);
          },
        },
        {
          id: "bulk-staff-purge",
          label: "Xóa vĩnh viễn đã chọn",
          variant: "outline",
          className: "border-destructive/40 text-destructive",
          onAction: async (rows) => {
            const ids = rows.map((u) => String(u.id));
            if (!ids.length) return;
            await onBulkPurge(ids);
          },
        },
      ]}
      filterToolbarExtra={
        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg"
            onClick={() => void onRefresh()}
          >
            <RefreshCw
              className={cn("size-4", isLoading && "animate-spin")}
              aria-hidden
            />
            Làm mới
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg"
            onClick={onClearFilters}
          >
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "nhan-su-thung-rac.csv" }}
      footer={paginationFooter}
    />
  );
}
