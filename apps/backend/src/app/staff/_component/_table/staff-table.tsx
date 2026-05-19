import type { ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { FilterX } from "lucide-react";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { getStaffColumns } from "../columns";
import type { StaffRow } from "../types";

interface StaffTableProps {
  data: StaffRow[];
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
  onView: (user: StaffRow) => void;
  onEdit: (user: StaffRow) => void;
  onDelete: (user: StaffRow) => void;
  busy: boolean;
  currentUserId?: string;
  onBulkDelete: (ids: string[]) => void;
  onClearFilters: () => void;
  roleOptions?: { value: string; label: string }[];
}

export function StaffTable(props: StaffTableProps) {
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
    onView,
    onEdit,
    onDelete,
    busy,
    currentUserId,
    onBulkDelete,
    onClearFilters,
    roleOptions,
  } = props;

  const columns = getStaffColumns({ onView, onEdit, onDelete, busy, currentUserId, roleOptions });

  const paginationFooter = (
    <AdminTablePaginationFooter
      page={page}
      pageSize={pageSize}
      total={total}
      isLoading={isLoading}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptySummary="Không có nhân sự"
      itemLabel="tài khoản"
    />
  );

  return (
    <AdminDataTable<StaffRow>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Không có tài khoản khớp tìm kiếm API hoặc bộ lọc vai trò / cột."
      defaultExpandedAll={false}
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo email, họ tên (API)…"
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      canSelectRow={(row) => String(row.original.id) !== String(currentUserId ?? "")}
      bulkActions={[
        {
          id: "bulk-staff-delete",
          label: "Xóa tạm đã chọn",
          variant: "outline",
          className: "border-destructive/40 text-destructive",
          onAction: async (rows) => {
            const ids = rows
              .filter((u) => String(u.id) !== String(currentUserId ?? ""))
              .map((u) => String(u.id));
            if (!ids.length) return;
            await onBulkDelete(ids);
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
            onClick={onClearFilters}
          >
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "nhan-su.csv" }}
      footer={paginationFooter}
    />
  );
}
