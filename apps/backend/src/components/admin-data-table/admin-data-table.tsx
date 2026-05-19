"use client";

// Simple debounce utility
function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = (...args: TArgs) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
  return debouncedFn;
}

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
  type RowSelectionState,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import {
  DatePicker,
  DateRangePicker,
  MultiSelectPicker,
  SelectPicker,
  TreeMultiSelectPicker,
  TreePicker,
} from "@ui/components/pickers";
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
import { buildCsvFromColumns } from "@/lib/build-table-csv";
import { downloadCsvFile } from "@/lib/export-csv";
import {
  csvBaseToXlsxFilename,
  downloadXlsxFile,
} from "@/lib/export-xlsx";
import { Separator } from "@ui/components/separator";
import { TypographyPSmall } from "@ui/components/typography";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/components/alert-dialog";

export type AdminDataTableBulkAction<TData> = {
  id: string;
  label: string;
  onAction: (selectedRows: TData[]) => void | Promise<void>;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  requiresSelection?: boolean;
  clearSelectionOnSuccess?: boolean;
  disabled?: (selectedRows: TData[]) => boolean;
  /** Hiển thị dialog xác nhận trước khi thực hiện */
  confirm?: boolean | {
    title: string;
    description?: string | ((selectedRows: TData[]) => string);
    confirmLabel?: string;
    destructive?: boolean;
  };
};

export type AdminDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getSubRows?: (row: TData) => TData[] | undefined;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
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
  /** true: lọc từ lá lên (giữ cha khi còn lá con khớp) — dùng cho cây */
  filterFromLeafRows?: boolean;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  /** Nút / nhóm tùy chọn cạnh ô tìm nhanh (vd. “Xóa bộ lọc”) */
  filterToolbarExtra?: ReactNode;
  /** Phân trang / tóm tắt ngay dưới bảng */
  footer?: ReactNode;
  /**
   * Hiện nút xuất CSV + Excel (dữ liệu đúng mảng `data` hiện tại — thường là một trang/lớp đã lọc).
   */
  csvExport?: boolean | { fileName?: string; sheetName?: string };
  /** Bật cột chọn dòng cho thao tác hàng loạt */
  rowSelectionEnabled?: boolean;
  /** Kiểm soát dòng nào được phép tick */
  canSelectRow?: (row: Row<TData>) => boolean;
  selectedRowIds?: RowSelectionState;
  onSelectedRowIdsChange?: OnChangeFn<RowSelectionState>;
  bulkActions?: AdminDataTableBulkAction<TData>[];
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
  filterFromLeafRows: filterFromLeafRowsProp = false,
  columnFilters: columnFiltersControlled,
  onColumnFiltersChange,
  globalFilter: globalFilterControlled,
  onGlobalFilterChange,
  filterToolbarExtra,
  footer,
  csvExport,
  rowSelectionEnabled = false,
  canSelectRow,
  getRowId,
  selectedRowIds: selectedRowIdsControlled,
  onSelectedRowIdsChange,
  bulkActions = [],
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFiltersInternal, setColumnFiltersInternal] =
    useState<ColumnFiltersState>([]);
  const [globalFilterInternal, setGlobalFilterInternal] = useState("");
  const [selectedRowIdsInternal, setSelectedRowIdsInternal] = useState<RowSelectionState>({});
  const [runningBulkActionId, setRunningBulkActionId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<AdminDataTableBulkAction<TData> | null>(null);
  const columnFilters = columnFiltersControlled ?? columnFiltersInternal;
  const setColumnFilters =
    onColumnFiltersChange ?? setColumnFiltersInternal;
  const globalFilter = globalFilterControlled ?? globalFilterInternal;
  const setGlobalFilter = onGlobalFilterChange ?? setGlobalFilterInternal;
  const selectedRowIds = selectedRowIdsControlled ?? selectedRowIdsInternal;
  const setSelectedRowIds = onSelectedRowIdsChange ?? setSelectedRowIdsInternal;
  const showGlobalFilter =
    getGlobalFilterText != null || onGlobalFilterChange != null;
  const csvExportEnabled = Boolean(csvExport);
  const hasBulkActions = bulkActions.length > 0;
  const exportFileNameProp =
    typeof csvExport === "object" && csvExport != null
      ? csvExport.fileName?.trim()
      : undefined;
  const exportSheetNameProp =
    typeof csvExport === "object" && csvExport != null
      ? csvExport.sheetName?.trim()
      : undefined;
  const resolvedCsvFileName = useMemo(() => {
    if (exportFileNameProp) {
      return exportFileNameProp.toLowerCase().endsWith(".csv")
        ? exportFileNameProp
        : `${exportFileNameProp}.csv`;
    }
    return `xuat-bang-${new Date().toISOString().slice(0, 10)}.csv`;
  }, [exportFileNameProp]);
  const resolvedXlsxFileName = useMemo(
    () => csvBaseToXlsxFilename(resolvedCsvFileName),
    [resolvedCsvFileName],
  );

  const handleCsvExport = useCallback(() => {
    const { headers, rows } = buildCsvFromColumns(data, columns);
    downloadCsvFile(resolvedCsvFileName, headers, rows);
  }, [columns, data, resolvedCsvFileName]);

  const handleXlsxExport = useCallback(() => {
    const { headers, rows } = buildCsvFromColumns(data, columns);
    void downloadXlsxFile(
      resolvedXlsxFileName,
      headers,
      rows,
      exportSheetNameProp || "Dữ liệu",
    );
  }, [columns, data, exportSheetNameProp, resolvedXlsxFileName]);
  const [expanded, setExpanded] = useState<ExpandedState>(
    defaultExpandedAll ? true : {},
  );

  const expanderColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: "_expand",
      header: () => null,
      cell: ({ row }) => {
        const indent = row.depth * 24;
        if (!row.getCanExpand()) {
          return (
            <span
              className="inline-block shrink-0"
              style={{ width: `${48 + indent}px` }}
              aria-hidden
            />
          );
        }
        return (
          <div
            className="flex items-center"
            style={{ paddingLeft: `${indent}px` }}
          >
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
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      meta: { disableColumnFilter: true },
      size: 44,
    }),
    [],
  );

  const selectionColumn = useMemo<ColumnDef<TData, unknown>>(
    () => ({
      id: "_select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            !table.getIsAllPageRowsSelected() && table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          aria-label="Chọn tất cả dòng"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
          disabled={!row.getCanSelect()}
          aria-label="Chọn dòng"
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
      meta: { disableColumnFilter: true, className: "sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" } as any,
      size: 44,
    }),
    [],
  );

  const tableColumns = useMemo(
    () => {
      const built: ColumnDef<TData, unknown>[] = [];
      if (rowSelectionEnabled) built.push(selectionColumn);
      if (getSubRows) built.push(expanderColumn);
      built.push(...columns);
      return built;
    },
    [columns, expanderColumn, getSubRows, rowSelectionEnabled, selectionColumn],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      expanded,
      rowSelection: selectedRowIds,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setSelectedRowIds,
    getSubRows,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    manualFiltering,
    filterFromLeafRows: filterFromLeafRowsProp,
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
    enableRowSelection: rowSelectionEnabled
      ? (row) => (canSelectRow ? canSelectRow(row) : true)
      : false,
  });

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  // Recursively collect selected rows including sub-rows for tree-structured tables
  // When parent is selected, all descendants are also considered selected
  const selectedRows = useMemo(() => {
    const result: TData[] = [];
    const addedIds = new Set<string>();
    const visit = (rws: Row<TData>[], parentSelected = false) => {
      for (const row of rws) {
        const isSelected = row.getIsSelected() || parentSelected;
        if (isSelected && !addedIds.has(row.id)) {
          result.push(row.original);
          addedIds.add(row.id);
        }
        if (row.subRows?.length) {
          visit(row.subRows, isSelected);
        }
      }
    };
    visit(table.getRowModel().rows);
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, table.getState().rowSelection]);
  const selectedCount = selectedRows.length;

  const runBulkAction = useCallback(
    async (action: AdminDataTableBulkAction<TData>) => {
      if (runningBulkActionId != null) return;
      const requiresSelection = action.requiresSelection ?? true;
      if (requiresSelection && selectedRows.length === 0) return;
      if (action.disabled?.(selectedRows)) return;
      // If action has confirm, show confirmation dialog first
      if (action.confirm) {
        setConfirmAction(action);
        return;
      }
      setRunningBulkActionId(action.id);
      try {
        await action.onAction(selectedRows);
        if (action.clearSelectionOnSuccess ?? true) {
          table.resetRowSelection();
        }
      } finally {
        setRunningBulkActionId(null);
      }
    },
    [runningBulkActionId, selectedRows, table],
  );

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;
    setRunningBulkActionId(confirmAction.id);
    try {
      await confirmAction.onAction(selectedRows);
      if (confirmAction.clearSelectionOnSuccess ?? true) {
        table.resetRowSelection();
      }
    } finally {
      setRunningBulkActionId(null);
      setConfirmAction(null);
    }
  }, [confirmAction, selectedRows, table]);

  const filterableHeaders = table
    .getFlatHeaders()
    .filter(
      (h) =>
        h.column.getCanFilter() &&
        !h.column.columnDef.meta?.disableColumnFilter,
    );

  // Debounced column filter input component
  function DebouncedFilterInput({
    column,
    controlId,
    placeholder,
    type = "text",
  }: {
    column: Header<TData, unknown>["column"];
    controlId: string;
    placeholder: string;
    type?: "text" | "number";
  }) {
    const [value, setValue] = useState(() => (column.getFilterValue() as string) ?? "");

    // Debounce the actual filter update
    const debouncedSetFilter = useMemo(
      () =>
        debounce((nextValue: string) => {
          column.setFilterValue(nextValue === "" ? undefined : type === "number" ? Number(nextValue) : nextValue);
        }, 300),
      [column, type]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedSetFilter.cancel();
      };
    }, [debouncedSetFilter]);

    return (
      <Input
        id={controlId}
        type={type}
        className="h-9 text-sm rounded-lg"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          debouncedSetFilter(next);
        }}
      />
    );
  }

  function renderOutsideColumnFilter(header: Header<TData, unknown>) {
    const col = header.column;
    const controlId = `admin-col-filter-ctl-${header.id}`;
    const meta = col.columnDef.meta;
    const variant = meta?.filterVariant ?? "text";
    const ph = meta?.filterPlaceholder ?? "Lọc…";

    if (variant === "select") {
      return (
        <SelectPicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
          options={meta?.selectOptions ?? []}
        />
      );
    }

    if (variant === "multi-select") {
      return (
        <MultiSelectPicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
          options={meta?.selectOptions ?? []}
        />
      );
    }

    if (variant === "tree-select") {
      return (
        <TreePicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
          options={meta?.treeOptions ?? []}
        />
      );
    }

    if (variant === "tree-multi-select") {
      return (
        <TreeMultiSelectPicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
          options={meta?.treeOptions ?? []}
        />
      );
    }

    if (variant === "date") {
      return (
        <DatePicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
        />
      );
    }

    if (variant === "date-range") {
      return (
        <DateRangePicker
          id={controlId}
          value={col.getFilterValue()}
          onChange={(v: unknown) => col.setFilterValue(v)}
        />
      );
    }

    if (variant === "number") {
      return (
        <DebouncedFilterInput
          column={col}
          controlId={controlId}
          placeholder={ph}
          type="number"
        />
      );
    }

    return (
      <DebouncedFilterInput
        column={col}
        controlId={controlId}
        placeholder={ph}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
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
        filterToolbarExtra ||
        csvExportEnabled ||
        (rowSelectionEnabled && hasBulkActions)) && (
        <div className="rounded-lg border border-border bg-card p-3 sm:p-4 space-y-4">
          {showGlobalFilter || filterToolbarExtra || csvExportEnabled ? (
            <div className="flex flex-wrap items-end gap-3">
              {showGlobalFilter ? (
                <div className="flex min-w-[min(100%,18rem)] flex-1 flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Tìm nhanh
                  </label>
                  <Input
                    placeholder={globalFilterPlaceholder}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="bg-background rounded-lg w-full"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-end gap-2 shrink-0">
                {csvExportEnabled ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Xuất file
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg"
                        disabled={data.length === 0}
                        onClick={handleCsvExport}
                        title="CSV: cột phân tách bằng ; + UTF-16 LE (Excel VN)"
                      >
                        <Download className="size-4" />
                        CSV
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg"
                        disabled={data.length === 0}
                        onClick={handleXlsxExport}
                        title="Excel: cột rộng theo nội dung, Unicode chuẩn"
                      >
                        <Download className="size-4" />
                        Excel
                      </Button>
                    </div>
                  </div>
                ) : null}
                {filterToolbarExtra ? (
                  <div className="flex flex-wrap gap-2">{filterToolbarExtra}</div>
                ) : null}
              </div>
            </div>
          ) : null}
          <BulkActionsBar
            visible={rowSelectionEnabled && hasBulkActions}
            selectedCount={selectedCount}
            bulkActions={bulkActions}
            selectedRows={selectedRows}
            runningBulkActionId={runningBulkActionId}
            onRunAction={runBulkAction}
          />
          {filterableHeaders.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <TypographyPSmall className="font-semibold">
                Lọc theo cột
              </TypographyPSmall>
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

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto pt-2">
        <Table className="text-sm min-w-[640px] sm:min-w-0">
          <TableHeader>
            {headerGroups.map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "align-top font-semibold whitespace-normal",
                      header.column.getCanSort() && "cursor-pointer select-none",
                      (header.column.columnDef.meta as any)?.className
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
                    row.depth > 0 && "bg-muted/10",
                    row.depth > 1 && "bg-muted/20",
                    getRowClassName?.(row),
                  )}
                  style={{
                    borderLeft:
                      row.depth > 0
                        ? `3px solid hsl(var(--primary) / ${0.15 + row.depth * 0.1})`
                        : undefined,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colIndex = cell.column.getIndex();
                    // Calculate which column should get indent:
                    // if rowSelection + expander: first data column is at index 2
                    // if only expander: first data column is at index 1
                    // if only rowSelection: first data column is at index 1
                    const firstDataColumnIndex =
                      (rowSelectionEnabled ? 1 : 0) + (getSubRows ? 1 : 0);
                    const indent =
                      getSubRows && colIndex === firstDataColumnIndex ? row.depth * 24 : 0;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "whitespace-normal align-middle max-w-[min(420px,40vw)]",
                          (cell.column.columnDef.meta as any)?.className
                        )}
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
      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 sm:px-4">
          {footer}
        </div>
      ) : null}

      <BulkActionConfirmDialog
        confirmAction={confirmAction}
        selectedCount={selectedCount}
        selectedRows={selectedRows}
        runningBulkActionId={runningBulkActionId}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

// Extracted component for bulk action confirmation dialog
type BulkActionConfirmDialogProps<TData> = {
  confirmAction: AdminDataTableBulkAction<TData> | null;
  selectedCount: number;
  selectedRows: TData[];
  runningBulkActionId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function BulkActionConfirmDialog<TData>({
  confirmAction,
  selectedCount,
  selectedRows,
  runningBulkActionId,
  onCancel,
  onConfirm,
}: BulkActionConfirmDialogProps<TData>) {
  const isOpen = confirmAction != null;

  const title = typeof confirmAction?.confirm === 'object'
    ? confirmAction.confirm.title
    : confirmAction?.label ?? 'Xác nhận thao tác';

  const description = typeof confirmAction?.confirm === 'object' && confirmAction.confirm.description
    ? typeof confirmAction.confirm.description === 'function'
      ? confirmAction.confirm.description(selectedRows)
      : confirmAction.confirm.description
    : `Bạn đã chọn ${selectedCount} mục. Thao tác này không thể hoàn tác.`;

  const confirmLabel = typeof confirmAction?.confirm === 'object'
    ? confirmAction.confirm.confirmLabel
    : 'Xác nhận';

  const isDestructive = typeof confirmAction?.confirm === 'object' && confirmAction.confirm.destructive;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={runningBulkActionId != null}
            className={isDestructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
          >
            {runningBulkActionId != null ? 'Đang xử lý...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Extracted component for bulk actions bar
type BulkActionsBarProps<TData> = {
  visible: boolean;
  selectedCount: number;
  bulkActions: AdminDataTableBulkAction<TData>[];
  selectedRows: TData[];
  runningBulkActionId: string | null;
  onRunAction: (action: AdminDataTableBulkAction<TData>) => void;
};

function BulkActionsBar<TData>({
  visible,
  selectedCount,
  bulkActions,
  selectedRows,
  runningBulkActionId,
  onRunAction,
}: BulkActionsBarProps<TData>) {
  if (!visible) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
      <p className="text-xs font-medium text-muted-foreground">
        Đã chọn <span className="font-semibold text-foreground">{selectedCount}</span> dòng
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {bulkActions.map((action) => {
          const requiresSelection = action.requiresSelection ?? true;
          const disabledBySelection = requiresSelection && selectedCount === 0;
          const disabledByAction = action.disabled?.(selectedRows) ?? false;
          const isRunning = runningBulkActionId === action.id;
          return (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.variant ?? "outline"}
              className={cn("h-8 gap-1.5 rounded-lg", action.className)}
              disabled={isRunning || runningBulkActionId != null || disabledBySelection || disabledByAction}
              onClick={() => onRunAction(action)}
            >
              {action.icon}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
