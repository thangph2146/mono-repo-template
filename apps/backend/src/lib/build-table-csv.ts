import type { ColumnDef } from "@tanstack/react-table";

function stringifyCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
}

function columnTitle<T>(col: ColumnDef<T, unknown>): string {
  const h = col.header;
  if (typeof h === "string" && h.trim()) return h.trim();
  if ("accessorKey" in col && col.accessorKey != null) return String(col.accessorKey);
  return col.id ?? "";
}

function cellText<T>(row: T, col: ColumnDef<T, unknown>): string {
  try {
    if ("accessorFn" in col && typeof col.accessorFn === "function") {
      return stringifyCell(col.accessorFn(row, 0));
    }
    if ("accessorKey" in col && col.accessorKey != null) {
      const key = String(col.accessorKey);
      return stringifyCell((row as Record<string, unknown>)[key]);
    }
  } catch {
    return "";
  }
  return "";
}

function shouldExportColumn<T>(col: ColumnDef<T, unknown>): boolean {
  if (col.id === "_expand") return false;
  if (col.id === "actions") return false;
  const meta = col.meta as { excludeFromExport?: boolean } | undefined;
  if (meta?.excludeFromExport) return false;
  return true;
}

/**
 * Xuất đúng mảng `data` hiện có (vd. một trang API / đã lọc client).
 * Cột không có accessorKey/accessorFn sẽ thành ô trống.
 */
export function buildCsvFromColumns<T>(
  data: T[],
  columns: ColumnDef<T, unknown>[],
): { headers: string[]; rows: string[][] } {
  const exportCols = columns.filter(shouldExportColumn);
  const headers = exportCols.map(columnTitle);
  const rows = data.map((row) => exportCols.map((col) => cellText(row, col)));
  return { headers, rows };
}
