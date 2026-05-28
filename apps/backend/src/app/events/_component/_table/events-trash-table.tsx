"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { FilterX, RefreshCw } from "lucide-react";
import type { EventRow } from "../types";

export interface EventsTrashTableProps {
  data: EventRow[]; columns: ColumnDef<EventRow>[]; isLoading: boolean;
  columnFilters: ColumnFiltersState; onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string; onGlobalFilterChange: OnChangeFn<string>;
  selectedRowIds: RowSelectionState; onSelectedRowIdsChange: OnChangeFn<RowSelectionState>;
  page: number; pageSize: number; total: number;
  onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void;
  onRefresh: () => void; onClearFilters: () => void;
  onBulkRestore: (rows: EventRow[]) => Promise<void>;
  onBulkPurge: (rows: EventRow[]) => Promise<void>;
  isFetching?: boolean;
}

export function EventsTrashTable({
  data, columns, isLoading, columnFilters, onColumnFiltersChange,
  globalFilter, onGlobalFilterChange, selectedRowIds, onSelectedRowIdsChange,
  page, pageSize, total, onPageChange, onPageSizeChange,
  onRefresh, onClearFilters, onBulkRestore, onBulkPurge, isFetching,
}: EventsTrashTableProps) {
  return (
    <AdminDataTable<EventRow>
      data={data} getRowId={(row) => row.id} columns={columns} isLoading={isLoading}
      emptyLabel="Thùng rác trống." manualFiltering
      columnFilters={columnFilters} onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter} onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm trong thùng rác..."
      filterToolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => { void onRefresh(); }}>
            <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden /> Làm mới
          </Button>
          <Button type="button" variant="destructive" onClick={onClearFilters}>
            <FilterX className="size-4" aria-hidden /> Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "su-kien-thung-rac.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds} onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        { id: "bulk-event-restore", label: "Khôi phục đã chọn", variant: "default",
          confirm: { title: "Khôi phục các sự kiện đã chọn?", description: (rows) => `Bạn đã chọn ${rows.length} sự kiện.`, confirmLabel: "Khôi phục" }, onAction: onBulkRestore },
        { id: "bulk-event-purge", label: "Xóa vĩnh viễn đã chọn", variant: "destructive",
          confirm: { title: "Xóa vĩnh viễn các sự kiện đã chọn?", description: () => `Hành động này không thể hoàn tác.`, confirmLabel: "Xóa vĩnh viễn", destructive: true }, onAction: onBulkPurge },
      ]}
      footer={<AdminTablePaginationFooter page={page} pageSize={pageSize} total={total} isLoading={isLoading}
        onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} emptySummary="Không có sự kiện trong thùng rác" itemLabel="sự kiện" />}
    />
  );
}
