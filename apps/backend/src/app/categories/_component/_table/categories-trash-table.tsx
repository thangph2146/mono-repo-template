"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { RefreshCw, FilterX } from "lucide-react";
import type { CategoryRow } from "../types";

export interface CategoriesTrashTableProps {
  data: CategoryRow[];
  columns: ColumnDef<CategoryRow>[];
  isLoading: boolean;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  selectedRowIds: RowSelectionState;
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  onBulkRestore: (rows: CategoryRow[]) => Promise<void>;
  onBulkPurge: (rows: CategoryRow[]) => Promise<void>;
  isFetching?: boolean;
}

export function CategoriesTrashTable({
  data,
  columns,
  isLoading,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  selectedRowIds,
  onSelectedRowIdsChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onClearFilters,
  onBulkRestore,
  onBulkPurge,
  isFetching,
}: CategoriesTrashTableProps) {
  return (
    <AdminDataTable<CategoryRow>
      data={data}
      getRowId={(row) => String(row.id)}
      getSubRows={(row) => (row as CategoryRow).subRows}
      defaultExpandedAll
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên, slug..."
      filterToolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg"
            onClick={() => {
              void onRefresh();
            }}
          >
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden />
            Làm mới
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg"
            onClick={onClearFilters}
          >
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "danh-muc-thung-rac.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-category-restore",
          label: "Khôi phục đã chọn",
          confirm: {
            title: "Khôi phục các danh mục đã chọn?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} danh mục. Các danh mục sẽ được khôi phục về danh sách đang hoạt động.`,
            confirmLabel: "Khôi phục",
            destructive: false,
          },
          onAction: onBulkRestore,
        },
        {
          id: "bulk-category-purge",
          label: "Xóa vĩnh viễn đã chọn",
          variant: "outline",
          className: "border-destructive/40 text-destructive",
          confirm: {
            title: "Xóa vĩnh viễn các danh mục đã chọn?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} danh mục. Hành động này không thể hoàn tác!`,
            confirmLabel: "Xóa vĩnh viễn",
            destructive: true,
          },
          onAction: onBulkPurge,
        },
      ]}
      footer={
        <AdminTablePaginationFooter
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptySummary="Không có danh mục trong thùng rác"
          itemLabel="danh mục"
        />
      }
    />
  );
}
