"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { RefreshCw, FilterX } from "lucide-react";
import type { PostListRow } from "../types";

export interface PostsTrashTableProps {
  data: PostListRow[];
  columns: ColumnDef<PostListRow>[];
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
  onBulkRestore: (rows: PostListRow[]) => Promise<void>;
  onBulkPurge: (rows: PostListRow[]) => Promise<void>;
  isFetching?: boolean;
}

export function PostsTrashTable({
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
}: PostsTrashTableProps) {
  return (
    <AdminDataTable<PostListRow>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Thùng rác trống."
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm trong thùng rác..."
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
      csvExport={{ fileName: "bai-viet-thung-rac.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-post-restore",
          label: "Khôi phục đã chọn",
          variant: "default",
          confirm: {
            title: "Khôi phục các bài viết đã chọn?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} bài viết. Các bài viết sẽ được khôi phục về danh sách đang hoạt động.`,
            confirmLabel: "Khôi phục",
            destructive: false,
          },
          onAction: onBulkRestore,
        },
        {
          id: "bulk-post-purge",
          label: "Xóa vĩnh viễn đã chọn",
          variant: "destructive",
          confirm: {
            title: "Xóa vĩnh viễn các bài viết đã chọn?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} bài viết. Hành động này không thể hoàn tác!`,
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
          emptySummary="Không có bài viết trong thùng rác"
          itemLabel="bài viết"
        />
      }
    />
  );
}
