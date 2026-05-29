"use client"

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table"
import { RefreshCw, FilterX } from "lucide-react"
import { Button } from "@ui/components/button"
import { AdminDataTable } from "@/components/admin-data-table"
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer"
import type { ParentStudent } from "../types"

export interface ParentStudentTableProps {
  data: ParentStudent[]
  columns: ColumnDef<ParentStudent>[]
  isLoading: boolean
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  globalFilter: string
  onGlobalFilterChange: OnChangeFn<string>
  selectedRowIds: RowSelectionState
  onSelectedRowIdsChange: OnChangeFn<RowSelectionState>
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh: () => void
  onClearFilters: () => void
  onBulkApprove: (rows: ParentStudent[]) => Promise<void>
  onBulkReject: (rows: ParentStudent[]) => Promise<void>
  canApprove: boolean
  isFetching?: boolean
}

export function ParentStudentTable({
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
  onBulkApprove,
  onBulkReject,
  canApprove,
  isFetching,
}: ParentStudentTableProps) {
  return (
    <AdminDataTable<ParentStudent>
      data={data}
      getRowId={(row) => String(row.id)}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Không có yêu cầu nào."
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm mã sinh viên, họ tên, ID phụ huynh…"
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
      rowSelectionEnabled
      selectedRowIds={selectedRowIds}
      onSelectedRowIdsChange={onSelectedRowIdsChange}
      bulkActions={[
        ...(canApprove
          ? [
              {
                id: "bulk-parent-student-approve" as const,
                label: "Duyệt đã chọn",
                variant: "default" as const,
                confirm: {
                  title: "Duyệt các yêu cầu đã chọn?",
                  description: (rows: ParentStudent[]) =>
                    `Bạn đã chọn ${rows.length} yêu cầu. Các yêu cầu sẽ được duyệt và phụ huynh sẽ được xem bảng điểm.`,
                  confirmLabel: "Duyệt",
                },
                onAction: onBulkApprove,
              },
              {
                id: "bulk-parent-student-reject" as const,
                label: "Từ chối đã chọn",
                variant: "destructive" as const,
                confirm: {
                  title: "Từ chối các yêu cầu đã chọn?",
                  description: (rows: ParentStudent[]) =>
                    `Bạn đã chọn ${rows.length} yêu cầu. Các yêu cầu sẽ bị từ chối và phụ huynh sẽ thấy thông báo.`,
                  confirmLabel: "Từ chối",
                  destructive: true,
                },
                onAction: onBulkReject,
              },
            ]
          : []),
      ]}
      footer={
        <AdminTablePaginationFooter
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          emptySummary="Không có yêu cầu"
          itemLabel="yêu cầu"
        />
      }
    />
  )
}
