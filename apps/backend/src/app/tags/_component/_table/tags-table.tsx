"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { RefreshCw, FilterX } from "lucide-react";
import type { TagTreeRow } from "../types";

export interface TagsTableProps {
  data: TagTreeRow[];
  columns: ColumnDef<TagTreeRow>[];
  isLoading: boolean;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  selectedRowIds: RowSelectionState;
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>;
  total: number;
  onRefresh: () => void;
  onClearFilters: () => void;
  onBulkDelete: (rows: TagTreeRow[]) => Promise<void>;
  isFetching?: boolean;
}

export function TagsTable({
  data,
  columns,
  isLoading,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  selectedRowIds,
  onSelectedRowIdsChange,
  total,
  onRefresh,
  onClearFilters,
  onBulkDelete,
  isFetching,
}: TagsTableProps) {
  return (
    <AdminDataTable<TagTreeRow>
      data={data}
      getRowId={(row) => String(row.id)}
      getSubRows={(row) => row.subRows}
      defaultExpandedAll
      filterFromLeafRows
      columns={columns}
      isLoading={isLoading}
      emptyLabel='Chưa có thẻ — bấm "Thêm thẻ".'
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên nhóm, tên thẻ hoặc slug..."
      filterToolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline" 
            onClick={() => { void onRefresh(); }}
          >
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden />
            Làm mới
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClearFilters}
          >
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "the-dang-hoat-dong.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      canSelectRow={(row) => !row.original.isGroup}
      bulkActions={[
        {
          id: "bulk-tag-delete",
          label: "Xóa tạm đã chọn",
          variant: "destructive",
          confirm: {
            title: "Đưa các thẻ đã chọn vào thùng rác?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} thẻ. Các thẻ sẽ được chuyển vào thùng rác và có thể khôi phục sau.`,
            confirmLabel: "Xóa tạm",
            destructive: true,
          },
          onAction: onBulkDelete,
        },
      ]}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `Tổng ${total} thẻ`}
          </p>
        </div>
      }
    />
  );
}
