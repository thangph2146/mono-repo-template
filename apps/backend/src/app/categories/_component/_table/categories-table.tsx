"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState, Row } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { RefreshCw, FilterX } from "lucide-react";
import type { CategoryRow } from "../types";

export interface CategoriesTableProps {
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
  onBulkDelete: (rows: CategoryRow[]) => Promise<void>;
  isFetching?: boolean;
  canSelectRow?: (row: Row<CategoryRow>) => boolean;
}

export function CategoriesTable({
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
  onBulkDelete,
  isFetching,
  canSelectRow,
}: CategoriesTableProps) {
  return (
    <AdminDataTable<CategoryRow>
      data={data}
      getRowId={(row) => String(row.id)}
      getSubRows={(row) => (row as CategoryRow).subRows}
      defaultExpandedAll
      columns={columns}
      isLoading={isLoading}
      emptyLabel='Chưa có danh mục — bấm "Thêm danh mục".'
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên, slug, mô tả..."
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
      csvExport={{ fileName: "danh-muc-dang-hoat-dong.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      canSelectRow={canSelectRow}
      bulkActions={[
        {
          id: "bulk-category-delete",
          label: "Xóa tạm đã chọn",
          variant: "outline",
          className: "border-destructive/40 text-destructive",
          confirm: {
            title: "Đưa các danh mục đã chọn vào thùng rác?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} danh mục. Các danh mục sẽ được chuyển vào thùng rác và có thể khôi phục sau.`,
            confirmLabel: "Xóa tạm",
            destructive: true,
          },
          onAction: onBulkDelete,
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
          emptySummary="Không có danh mục"
          itemLabel="danh mục"
        />
      }
    />
  );
}
