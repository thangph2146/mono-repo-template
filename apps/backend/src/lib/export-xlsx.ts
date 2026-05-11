import type { ColInfo } from "xlsx";

/**
 * Xuất .xlsx — đặt độ rộng cột theo nội dung (CSV không hỗ trợ width).
 */
export async function downloadXlsxFile(
  filename: string,
  headers: string[],
  rows: string[][],
  sheetName = "Dữ liệu",
): Promise<void> {
  const XLSX = await import("xlsx");
  const aoa = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colCount = Math.max(
    headers.length,
    ...rows.map((r) => r.length),
  );
  const cols: ColInfo[] = [];
  for (let c = 0; c < colCount; c++) {
    let max = String(headers[c] ?? "").length;
    for (const row of rows) {
      max = Math.max(max, String(row[c] ?? "").length);
    }
    const wch = Math.min(Math.max(max + 4, 14), 72);
    cols.push({ wch });
  }
  ws["!cols"] = cols;
  const wb = XLSX.utils.book_new();
  const safeName =
    sheetName.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Sheet1";
  XLSX.utils.book_append_sheet(wb, ws, safeName);
  const out = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename.replace(/\.csv$/i, "")}.xlsx`;
  XLSX.writeFile(wb, out);
}

/** Đổi tên file .csv → .xlsx (giữ stem). */
export function csvBaseToXlsxFilename(csvFileName: string): string {
  const base = csvFileName.replace(/\.csv$/i, "");
  return `${base}.xlsx`;
}
