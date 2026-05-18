"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import type { TagRow } from "../types";

export interface TagsTrashTableProps {
  data: TagRow[];
  columns: ColumnDef<TagRow>[];
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
  canDelete: boolean;
  bulkMutation: {
    mutateAsync: (input: { action: "delete" | "restore" | "hard-delete"; ids: string[] }) => Promise<unknown>;
  };
}

export function TagsTrashTable(props: TagsTrashTableProps) {
  const {
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
    canDelete,
    bulkMutation,
  } = props;

  return (
    <AdminDataTable<TagRow>
      data={data}
      getRowId={(row) => row.id}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Thùng rác trống."
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm trong thùng rác..."
      csvExport={{ fileName: "the-thung-rac.csv" }}
      rowSelectionEnabled={canDelete}
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={
        canDelete
          ? [
              {
                id: "bulk-tag-restore",
                label: "Khôi phục đã chọn",
                onAction: async (rows) => {
                  const ids = rows.map((r) => r.id);
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "restore", ids });
                },
              },
              {
                id: "bulk-tag-purge",
                label: "Xóa vĩnh viễn đã chọn",
                variant: "outline",
                className: "border-destructive/40 text-destructive",
                onAction: async (rows) => {
                  const ids = rows.map((r) => r.id);
                  if (!ids.length) return;
                  await bulkMutation.mutateAsync({ action: "hard-delete", ids });
                },
              },
            ]
          : []
      }
      footer={
        <AdminTablePaginationFooter
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptySummary="Không có thẻ trong thùng rác"
          itemLabel="thẻ"
        />
      }
    />
  );
}
