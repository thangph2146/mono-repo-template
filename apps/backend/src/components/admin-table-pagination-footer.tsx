"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

/** Mức page size dùng chung (API thường giới hạn ≤ 200). */
export const ADMIN_TABLE_PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50] as const;

export type AdminTablePaginationFooterProps = {
  page: number;
  pageSize: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  /** Parent nên `setPage(1)` khi đổi limit (vd. `useEffect` phụ thuộc `pageSize`). */
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  emptySummary: string;
  /** VD: `đơn` → `Hiển thị 1–20 / 100 đơn`; bỏ trống chỉ hiện `… / 100`. */
  itemLabel?: string;
};

export function AdminTablePaginationFooter({
  page,
  pageSize,
  total,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = ADMIN_TABLE_PAGE_SIZE_OPTIONS,
  emptySummary,
  itemLabel,
}: AdminTablePaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const summary =
    total === 0
      ? emptySummary
      : itemLabel
        ? `Hiển thị ${from}–${to} / ${total} ${itemLabel}`
        : `Hiển thị ${from}–${to} / ${total}`;

  const sizeChoices = useMemo(() => {
    const set = new Set<number>([...pageSizeOptions, pageSize]);
    return [...set].sort((a, b) => a - b);
  }, [pageSize, pageSizeOptions]);

  return (
    <>
      <p className="text-sm text-muted-foreground">{summary}</p>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Mỗi trang
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 w-[4.75rem] rounded-lg text-sm tabular-nums">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizeChoices.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="size-4" />
            Trước
          </Button>
          <span className="px-1 text-sm tabular-nums text-muted-foreground sm:px-2">
            Trang {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            Sau
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
