"use client";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type Header,
  type OnChangeFn,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib/utils";
import "@/components/admin-data-table/table-meta";

const ALL_SELECT = "__all__";

export type AdminDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  isLoading?: boolean;
  emptyLabel?: string;
  /** Mở toàn bộ nhánh cây lúc đầu */
  defaultExpandedAll?: boolean;
  getRowClassName?: (row: Row<TData>) => string | undefined;
  /** Ô tìm nhanh (chuỗi do bạn cung cấp cho mỗi dòng) */
  getGlobalFilterText?: (row: TData) => string;
  globalFilterPlaceholder?: string;
  /** Bật khi lọc do API/server — chỉ giữ state ô lọc, không lọc lại `data` trên client */
  manualFiltering?: boolean;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  /** Nút / nhóm tùy chọn cạnh khu vực lọc (vd. “Xóa bộ lọc”) */
  filterToolbarExtra?: ReactNode;
};

function includesText(a: unknown, q: string): boolean {
  if (!q) return true;
  const s = String(a ?? "").toLowerCase();
  return s.includes(q.toLowerCase());
}

function columnFilterToolbarLabel<TData>(
  header: Header<TData, unknown>,
): string {
  const meta = header.column.columnDef.meta;
  if (meta?.filterLabel) return meta.filterLabel;
  const h = header.column.columnDef.header;
  if (typeof h === "string") return h;
  return header.column.id;
}

export function AdminDataTable<TData>({
  data,
  columns,
  getSubRows,
  isLoading,
  emptyLabel = "Không có dữ liệu",
  defaultExpandedAll = true,
  getRowClassName,
  getGlobalFilterText,
  globalFilterPlaceholder = "Tìm trong bảng…",
  manualFiltering = false,
  columnFilters: columnFiltersControlled,
  onColumnFiltersChange,
  globalFilter: globalFilterControlled,
  onGlobalFilterChange,
  filterToolbarExtra,
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFiltersInternal, setColumnFiltersInternal] =
    useState<ColumnFiltersState>([]);
  const [globalFilterInternal, setGlobalFilterInternal] = useState("");
  const columnFilters = columnFiltersControlled ?? columnFiltersInternal;
  const setColumnFilters =
    onColumnFiltersChange ?? setColumnFiltersInternal;
  const globalFilter = globalFilterControlled ?? globalFilterInternal;
  const setGlobalFilter = onGlobalFilterChange ?? setGlobalFilterInternal;
  const showGlobalFilter =
    getGlobalFilterText != null || onGlobalFilterChange != null;
  const [expanded, setExpanded] = useState<ExpandedState>(
    defaultExpandedAll ? true : {},
  );

  const expanderColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: "_expand",
      header: () => null,
      cell: ({ row }) => {
        if (!row.getCanExpand()) {
          return <span className="inline-block w-8 shrink-0" aria-hidden />;
        }
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-expanded={row.getIsExpanded()}
            aria-label={row.getIsExpanded() ? "Thu gọn" : "Mở rộng"}
            onClick={(e) => {
              e.stopPropagation();
              row.getToggleExpandedHandler()();
            }}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      meta: { disableColumnFilter: true },
      size: 44,
    }),
    [],
  );

  const tableColumns = useMemo(
    () => (getSubRows ? [expanderColumn, ...columns] : columns),
    [columns, expanderColumn, getSubRows],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, globalFilter, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getSubRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualFiltering,
    // false: lọc từ dòng cha xuống (đúng cho cây SP→đơn vị). true + filterFn “luôn pass” ở lá
    // khiến cha luôn được giữ vì còn lá con → lọc cột như không chạy.
    filterFromLeafRows: false,
    globalFilterFn: manualFiltering
      ? "includesString"
      : getGlobalFilterText
        ? (row, _columnId, filterValue) => {
            const q = String(filterValue ?? "").trim();
            if (!q) return true;
            return includesText(getGlobalFilterText(row.original), q);
          }
        : "includesString",
    autoResetExpanded: false,
    defaultColumn: {
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue == null || filterValue === "") return true;
        return includesText(row.getValue(columnId), String(filterValue));
      },
    },
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const filterableHeaders = table
    .getFlatHeaders()
    .filter(
      (h) =>
        h.column.getCanFilter() &&
        !h.column.columnDef.meta?.disableColumnFilter,
    );

  function renderOutsideColumnFilter(header: Header<TData, unknown>) {
    const col = header.column;
    const controlId = `admin-col-filter-ctl-${header.id}`;
    const meta = col.columnDef.meta;
    const variant = meta?.filterVariant ?? "text";
    const ph = meta?.filterPlaceholder ?? "Lọc…";

    if (variant === "select" && meta?.selectOptions?.length) {
      const opts = meta.selectOptions;
      const v = (col.getFilterValue() as string) ?? ALL_SELECT;
      return (
        <Select
          value={v === "" || v == null ? ALL_SELECT : v}
          onValueChange={(next) =>
            col.setFilterValue(next === ALL_SELECT ? undefined : next)
          }
        >
          <SelectTrigger
            id={controlId}
            className="h-9 text-sm rounded-lg w-full min-w-[160px]"
          >
            <SelectValue placeholder="Tất cả">
              {v === ALL_SELECT ? "Tất cả" : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[min(60vh,22rem)] overflow-y-auto">
            <SelectItem value={ALL_SELECT}>Tất cả</SelectItem>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (variant === "number") {
      return (
        <Input
          id={controlId}
          type="number"
          className="h-9 text-sm rounded-lg"
          placeholder={ph}
          value={(col.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            col.setFilterValue(
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
        />
      );
    }

    return (
      <Input
        id={controlId}
        className="h-9 text-sm rounded-lg"
        placeholder={ph}
        value={(col.getFilterValue() as string) ?? ""}
        onChange={(e) =>
          col.setFilterValue(e.target.value === "" ? undefined : e.target.value)
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-md bg-muted/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(showGlobalFilter ||
        filterableHeaders.length > 0 ||
        filterToolbarExtra) && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          {filterToolbarExtra ? (
            <div className="flex flex-wrap justify-end gap-2">
              {filterToolbarExtra}
            </div>
          ) : null}
          {showGlobalFilter && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Tìm nhanh
              </label>
              <Input
                placeholder={globalFilterPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="bg-background rounded-lg max-w-3xl"
              />
            </div>
          )}
          {filterableHeaders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Lọc theo cột
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-3 items-end">
                {filterableHeaders.map((header) => (
                  <div
                    key={header.id}
                    className="flex flex-col gap-1 min-w-[min(100%,12rem)] w-[12rem]"
                  >
                    <label
                      htmlFor={`admin-col-filter-ctl-${header.id}`}
                      className="text-xs font-medium text-foreground/80"
                    >
                      {columnFilterToolbarLabel(header)}
                    </label>
                    <div>{renderOutsideColumnFilter(header)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card overflow-hidden py-4">
        <Table className="text-sm">
          <TableHeader>
            {headerGroups.map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "align-top font-semibold whitespace-normal",
                      header.column.getCanSort() && "cursor-pointer select-none",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex flex-col gap-1 py-1">
                        <span className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getIsSorted() === "asc"
                            ? " ↑"
                            : header.column.getIsSorted() === "desc"
                              ? " ↓"
                              : null}
                        </span>
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-depth={row.depth}
                  className={cn(
                    row.depth > 0 && "bg-muted/15",
                    getRowClassName?.(row),
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colIndex = cell.column.getIndex();
                    const indent =
                      getSubRows && colIndex === 1 ? row.depth * 14 : 0;
                    return (
                      <TableCell
                        key={cell.id}
                        className="whitespace-normal align-middle max-w-[min(420px,40vw)]"
                        style={{
                          paddingLeft:
                            indent > 0
                              ? `calc(0.5rem + ${indent}px)`
                              : undefined,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
