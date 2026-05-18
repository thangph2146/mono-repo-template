"use client";

import type { ColumnDef, ColumnFiltersState, OnChangeFn } from "@tanstack/react-table";
import { Button } from "@ui/components/button";
import { AdminDataTable } from "@/components/admin-data-table";
import { RefreshCw, FilterX } from "lucide-react";
import type { GuideGroup } from "../types";

export interface GuidesTableProps {
  data: GuideGroup[];
  columns: ColumnDef<GuideGroup>[];
  isLoading: boolean;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: OnChangeFn<string>;
  total: number;
  onRefresh: () => void;
  onClearFilters: () => void;
  isFetching?: boolean;
}

export function GuidesTable({
  data,
  columns,
  isLoading,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  total,
  onRefresh,
  onClearFilters,
  isFetching,
}: GuidesTableProps) {
  return (
    <AdminDataTable<GuideGroup>
      data={data}
      getRowId={(row) => String(row.id)}
      defaultExpandedAll={false}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Chưa có nhóm hướng dẫn nào."
      manualFiltering
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      globalFilterPlaceholder="Tìm theo section key, tiêu đề..."
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
      csvExport={{ fileName: "huong-dan-su-dung.csv" }}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `Tổng ${total} nhóm hướng dẫn`}
          </p>
        </div>
      }
    />
  );
}
