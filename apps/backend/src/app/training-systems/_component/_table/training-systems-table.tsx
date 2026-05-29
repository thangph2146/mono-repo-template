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
import type { TrainingSystemRow } from "../types"

export interface TrainingSystemsTableProps {
  data: TrainingSystemRow[]
  columns: ColumnDef<TrainingSystemRow>[]
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
  onBulkDelete: (rows: TrainingSystemRow[]) => Promise<void>
  isFetching?: boolean
}

export function TrainingSystemsTable({
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
}: TrainingSystemsTableProps) {
  return (
    <AdminDataTable<TrainingSystemRow>
      data={data}
      getRowId={(row) => row.id}
      columns={columns}
      isLoading={isLoading}
      emptyLabel='Chưa có hệ đào tạo — bấm "Thêm hệ đào tạo".'
      manualFiltering
      filterColumnVisibilityKey="admin-table-filter-visibility:training-systems-list"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo tên hoặc mã..."
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
            />
            Làm mới
          </Button>
          <Button type="button" variant="destructive" onClick={onClearFilters}>
            <FilterX className="size-4" aria-hidden />
            Xóa bộ lọc
          </Button>
        </div>
      }
      csvExport={{ fileName: "he-dao-tao.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-training-system-delete",
          label: "Xóa tạm đã chọn",
          variant: "destructive",
          confirm: {
            title: "Đưa các hệ đào tạo đã chọn vào thùng rác?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} hệ đào tạo. Các hệ đào tạo sẽ được chuyển vào thùng rác và có thể khôi phục sau.`,
            confirmLabel: "Xóa tạm",
            destructive: true,
          },
          onAction: onBulkDelete,
        },
      ]}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `Tổng ${total} hệ đào tạo`}
          </p>
        </div>
      }
    />
  )
}
