"use client"

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"
import { Button } from "@ui/components/button"
import { AdminDataTable } from "@/components/admin-data-table"
import { RefreshCw, FilterX } from "lucide-react"
import type { EventRow } from "../types"

export interface EventsTableProps {
  data: EventRow[]
  columns: ColumnDef<EventRow>[]
  isLoading: boolean
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  globalFilter: string
  onGlobalFilterChange: OnChangeFn<string>
  selectedRowIds: RowSelectionState
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>
  total: number
  onRefresh: () => void
  onClearFilters: () => void
  onBulkDelete: (rows: EventRow[]) => Promise<void>
  isFetching?: boolean
}

export function EventsTable({
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
}: EventsTableProps) {
  return (
    <AdminDataTable<EventRow>
      data={data}
      getRowId={(row) => row.id}
      columns={columns}
      isLoading={isLoading}
      emptyLabel='Chưa có sự kiện — bấm "Thêm sự kiện".'
      manualFiltering
      filterColumnVisibilityKey="admin-table-filter-visibility:events-list"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên..."
      filterToolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void onRefresh()
            }}
          >
            <RefreshCw
              className={isFetching ? "size-4 animate-spin" : "size-4"}
              aria-hidden
            />{" "}
            Làm mới
          </Button>
          <Button type="button" variant="destructive" onClick={onClearFilters}>
            <FilterX className="size-4" aria-hidden /> Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "su-kien.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-event-delete",
          label: "Xóa tạm đã chọn",
          variant: "destructive",
          confirm: {
            title: "Đưa các sự kiện đã chọn vào thùng rác?",
            description: (rows) => `Bạn đã chọn ${rows.length} sự kiện.`,
            confirmLabel: "Xóa tạm",
            destructive: true,
          },
          onAction: onBulkDelete,
        },
      ]}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `Tổng ${total} sự kiện`}
          </p>
        </div>
      }
    />
  )
}
