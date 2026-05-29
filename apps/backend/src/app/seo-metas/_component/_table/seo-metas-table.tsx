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
import type { SeoMetaRow } from "../types"

export interface SeoMetasTableProps {
  data: SeoMetaRow[]
  columns: ColumnDef<SeoMetaRow>[]
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
  onBulkDelete: (rows: SeoMetaRow[]) => Promise<void>
  isFetching?: boolean
}

export function SeoMetasTable({
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
}: SeoMetasTableProps) {
  return (
    <AdminDataTable<SeoMetaRow>
      data={data}
      getRowId={(row) => row.id}
      columns={columns}
      isLoading={isLoading}
      emptyLabel='Chưa có SEO metadata — bấm "Thêm SEO".'
      manualFiltering
      filterColumnVisibilityKey="admin-table-filter-visibility:seo-metas-list"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo đường dẫn..."
      filterToolbarExtra={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { void onRefresh() }}
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
      csvExport={{ fileName: "seo-metas.csv" }}
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        {
          id: "bulk-seo-meta-delete",
          label: "Xóa tạm đã chọn",
          variant: "destructive",
          confirm: {
            title: "Đưa các SEO metadata đã chọn vào thùng rác?",
            description: (rows) =>
              `Bạn đã chọn ${rows.length} mục. Các mục sẽ được chuyển vào thùng rác và có thể khôi phục sau.`,
            confirmLabel: "Xóa tạm",
            destructive: true,
          },
          onAction: onBulkDelete,
        },
      ]}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `Tổng ${total} SEO metadata`}
          </p>
        </div>
      }
    />
  )
}
