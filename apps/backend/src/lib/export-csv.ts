/** BOM UTF-8 (byte) */
const UTF8_BOM_BYTES = new Uint8Array([0xef, 0xbb, 0xbf]);

/** BOM UTF-16 LE — Excel Windows mở .csv bằng double-click thường nhận đúng Unicode hơn UTF-8. */
const UTF16LE_BOM_BYTES = new Uint8Array([0xff, 0xfe]);

const textEncoder = new TextEncoder();

/** Excel Việt Nam / EU thường dùng `;` làm dấu cột hệ thống. */
export type CsvDelimiter = "," | ";";

export type CsvEncoding = "utf-8" | "utf-16le";

export type CsvExportOptions = {
  /**
   * Dòng `sep=;` hoặc `sep=,` — bật mặc định để Excel tách đúng cột.
   */
  excelSepDirective?: boolean;
  encoding?: CsvEncoding;
  /** Mặc định `;` (chuẩn Excel regional VN). */
  delimiter?: CsvDelimiter;
};

/**
 * RFC 4180 (mở rộng delimiter): bọc trường khi có delimiter, ", xuống dòng hoặc khoảng trắng đầu/cuối.
 */
export function escapeDelimitedField(
  value: string,
  delimiter: CsvDelimiter,
): string {
  const s = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const escaped = s.replace(/"/g, '""');
  const mustQuote =
    escaped.includes(delimiter) ||
    /["\n]/.test(escaped) ||
    /^\s/.test(escaped) ||
    /\s$/.test(escaped);
  return mustQuote ? `"${escaped}"` : escaped;
}

/** Tương thích: CSV dấu phẩy cổ điển. */
export function escapeCsvField(value: string): string {
  return escapeDelimitedField(value, ",");
}

export function rowsToCsvContent(
  headers: string[],
  rows: string[][],
  delimiter: CsvDelimiter = ";",
): string {
  const esc = (v: string) => escapeDelimitedField(v, delimiter);
  const lines = [
    headers.map(esc).join(delimiter),
    ...rows.map((r) => r.map(esc).join(delimiter)),
  ];
  return lines.join("\r\n");
}

function encodeUtf16LeWithBom(text: string): Uint8Array {
  const n = text.length;
  const body = new Uint8Array(n * 2);
  const view = new DataView(body.buffer);
  for (let i = 0; i < n; i++) {
    view.setUint16(i * 2, text.charCodeAt(i), true);
  }
  const out = new Uint8Array(UTF16LE_BOM_BYTES.length + body.length);
  out.set(UTF16LE_BOM_BYTES, 0);
  out.set(body, UTF16LE_BOM_BYTES.length);
  return out;
}

export function csvToBlobParts(
  headers: string[],
  rows: string[][],
  options?: CsvExportOptions,
): BlobPart[] {
  const delimiter: CsvDelimiter = options?.delimiter ?? ";";
  const body = rowsToCsvContent(headers, rows, delimiter);
  const useSep = options?.excelSepDirective !== false;
  const sepLine = useSep ? `sep=${delimiter}\r\n` : "";
  const text = sepLine + body;
  const encoding: CsvEncoding = options?.encoding ?? "utf-16le";

  if (encoding === "utf-8") {
    const payload = textEncoder.encode(text);
    const out = new Uint8Array(UTF8_BOM_BYTES.length + payload.length);
    out.set(UTF8_BOM_BYTES, 0);
    out.set(payload, UTF8_BOM_BYTES.length);
    return [out as BlobPart];
  }
  return [encodeUtf16LeWithBom(text) as BlobPart];
}

export function csvToUtf8BlobParts(
  headers: string[],
  rows: string[][],
  options?: CsvExportOptions,
): BlobPart[] {
  return csvToBlobParts(headers, rows, { ...options, encoding: "utf-8" });
}

export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: string[][],
  options?: CsvExportOptions,
): void {
  const encoding: CsvEncoding = options?.encoding ?? "utf-16le";
  const mime =
    encoding === "utf-8"
      ? "text/csv;charset=utf-8"
      : "text/csv;charset=utf-16le";
  const blob = new Blob(csvToBlobParts(headers, rows, options), {
    type: mime,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
