import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import type { EntityMetadata } from '@mikro-orm/core';
import ExcelJS from 'exceljs';
import { PERSISTENT_ENTITY_CLASSES } from '../entities/registry';
import { DataBackupService, type StoreSyncBackupPayload } from './data-backup.service';

const EXCEL_META_SHEET = '_backup_meta';
/** Sheet đầu tiên (thân thiện người dùng); không dùng trong import entity. */
const EXCEL_README_SHEET = 'Huong_dan';

const HEADER_FILL = 'FF2B579A';
const HEADER_FONT = 'FFFFFFFF';
const BORDER_LIGHT = 'FFD0D7DE';

@Injectable()
export class DataExcelService {
  constructor(
    private readonly backup: DataBackupService,
    private readonly orm: MikroORM,
  ) {}

  async exportWorkbook(): Promise<ExcelJS.Buffer> {
    const payload = await this.backup.exportJson();
    const wb = new ExcelJS.Workbook();
    wb.creator = 'StoreSync';
    wb.created = new Date();
    wb.modified = new Date();
    wb.properties.date1904 = false;

    addReadmeSheet(wb, payload);

    const metaSheet = wb.addWorksheet(EXCEL_META_SHEET, { state: 'hidden' });
    metaSheet.getCell('A1').value = 'payloadJson';
    metaSheet.getCell('B1').value = JSON.stringify({
      format: payload.format,
      schemaVersion: payload.schemaVersion,
      entityImportOrder: payload.entityImportOrder,
    });

    for (const [className, rows] of Object.entries(payload.entities)) {
      const safeName = className.slice(0, 31);
      const sheet = wb.addWorksheet(safeName || 'Entity');
      if (rows.length === 0) {
        sheet.mergeCells('A1:D3');
        const c = sheet.getCell('A1');
        c.value = '(Không có bản ghi)';
        c.font = { italic: true, size: 12, color: { argb: 'FF666666' } };
        c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        continue;
      }
      const keys = unionKeys(rows);
      sheet.addRow(keys);
      for (const row of rows) {
        sheet.addRow(keys.map((k) => cellToExcel(row[k])));
      }
      formatEntitySheet(sheet, keys, rows.length);
    }

    return (await wb.xlsx.writeBuffer()) as ExcelJS.Buffer;
  }

  async importWorkbook(buffer: Uint8Array): Promise<{ inserted: number }> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const metaSheet = wb.getWorksheet(EXCEL_META_SHEET);
    let meta: {
      format: string;
      schemaVersion: number;
      entityImportOrder: string[];
    };
    if (metaSheet) {
      const raw = metaSheet.getCell('B1').value;
      if (typeof raw !== 'string' || !raw.trim()) {
        throw new Error('File Excel thiếu metadata (_backup_meta!B1).');
      }
      meta = JSON.parse(raw) as typeof meta;
    } else {
      meta = {
        format: 'storesync-mikro-backup',
        schemaVersion: 1,
        entityImportOrder: wb.worksheets
          .map((s) => s.name)
          .filter((n) => n !== EXCEL_META_SHEET && n !== EXCEL_README_SHEET),
      };
    }

    const metaByClass = new Map(
      PERSISTENT_ENTITY_CLASSES.map((c) => {
        const m = this.orm.getMetadata().get(c as never);
        return [m.className, m] as const;
      }),
    );

    const entities: Record<string, Record<string, unknown>[]> = {};
    for (const sheet of wb.worksheets) {
      if (sheet.name === EXCEL_META_SHEET || sheet.name === EXCEL_README_SHEET) {
        continue;
      }
      const entityMeta = metaByClass.get(sheet.name);
      if (!entityMeta) continue;
      const rows = sheetToObjects(sheet, entityMeta);
      if (rows.length > 0) {
        entities[sheet.name] = rows;
      }
    }

    const payload: StoreSyncBackupPayload = {
      format: meta.format as StoreSyncBackupPayload['format'],
      schemaVersion: meta.schemaVersion as StoreSyncBackupPayload['schemaVersion'],
      generatedAt: new Date().toISOString(),
      driverHint: 'excel-import',
      entities,
      entityImportOrder: meta.entityImportOrder.filter((n) => n in entities),
    };

    return this.backup.importJson(payload);
  }
}

function addReadmeSheet(
  wb: ExcelJS.Workbook,
  payload: StoreSyncBackupPayload,
): void {
  const sheet = wb.addWorksheet(EXCEL_README_SHEET, {
    properties: { tabColor: { argb: 'FF2B579A' } },
  });
  sheet.columns = [
    { width: 4 },
    { width: 42 },
    { width: 52 },
    { width: 14 },
  ];

  const title = sheet.getCell('B2');
  title.value = 'StoreSync — Sao lưu dữ liệu';
  title.font = { size: 20, bold: true, color: { argb: 'FF1F3864' } };
  sheet.mergeCells('B2:D2');

  sheet.getCell('B3').value = `Xuất lúc: ${payload.generatedAt}`;
  sheet.getCell('B3').font = { size: 11, color: { argb: 'FF5A5A5A' } };
  sheet.mergeCells('B3:D3');

  sheet.getCell('B5').value = 'Cách dùng nhanh';
  sheet.getCell('B5').font = { size: 13, bold: true, color: { argb: 'FF2B579A' } };

  const tips = [
    'Mỗi tab (trừ sheet này) là một entity trong database — hàng đầu là tên cột.',
    'Dùng bộ lọc trên hàng tiêu đề để tìm / lọc dữ liệu.',
    'Ô chứa JSON (object/array) đã được xuống dòng để dễ đọc; import vẫn đọc đúng.',
    'Sheet ẩn _backup_meta chứa metadata cho import — không xóa khi chỉnh sửa tay.',
    'Sau khi sửa, dùng chức năng Import Excel trên admin để nạp lại (ghi đè DB).',
  ];
  let r = 6;
  for (const line of tips) {
    const cell = sheet.getCell(`B${r}`);
    cell.value = `• ${line}`;
    cell.font = { size: 11 };
    cell.alignment = { wrapText: true, vertical: 'top' };
    r++;
  }

  r += 1;
  sheet.getCell(`B${r}`).value = 'Tổng quan dữ liệu';
  sheet.getCell(`B${r}`).font = { size: 13, bold: true, color: { argb: 'FF2B579A' } };
  r++;

  const headerRow = sheet.getRow(r);
  headerRow.getCell(2).value = 'Entity (class)';
  headerRow.getCell(3).value = 'Số bản ghi';
  headerRow.getCell(4).value = 'Ghi chú';
  headerRow.font = { bold: true, color: { argb: HEADER_FONT } };
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    if (col >= 2) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEADER_FILL },
      };
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  });
  r++;

  const entries = Object.entries(payload.entities).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  for (const [name, rows] of entries) {
    const row = sheet.getRow(r);
    row.getCell(2).value = name;
    row.getCell(3).value = rows.length;
    row.getCell(4).value = rows.length === 0 ? 'Trống' : 'OK';
    row.font = { size: 11 };
    for (let c = 2; c <= 4; c++) {
      row.getCell(c).border = thinBorder();
      row.getCell(c).alignment = {
        vertical: 'middle',
        horizontal: c === 3 ? 'center' : 'left',
      };
    }
    if (r % 2 === 0) {
      for (let c = 2; c <= 4; c++) {
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F6FC' },
        };
      }
    }
    r++;
  }

  sheet.views = [{ showGridLines: true }];
}

function formatEntitySheet(
  sheet: ExcelJS.Worksheet,
  keys: string[],
  dataRowCount: number,
): void {
  const colCount = keys.length;
  const lastRow = dataRowCount + 1;

  sheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: lastRow, column: colCount },
  };

  const header = sheet.getRow(1);
  header.height = 22;
  header.font = { bold: true, color: { argb: HEADER_FONT }, size: 11 };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let c = 1; c <= colCount; c++) {
    const cell = header.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    };
    cell.border = thinBorder();
  }

  const samples: string[][] = keys.map(() => []);
  const maxSample = Math.min(lastRow, 1 + 150);
  for (let r = 2; r <= maxSample; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= colCount; c++) {
      const v = row.getCell(c).value;
      const s =
        v === null || v === undefined
          ? ''
          : typeof v === 'object' && v !== null && 'richText' in (v as object)
            ? String((v as { richText?: { text: string }[] }).richText?.map((x) => x.text).join('') ?? '')
            : typeof v === 'object'
              ? JSON.stringify(v)
              : String(v);
      samples[c - 1]?.push(s);
    }
  }

  for (let c = 1; c <= colCount; c++) {
    const col = sheet.getColumn(c);
    const w = estimateColumnWidth(keys[c - 1] ?? '', samples[c - 1] ?? []);
    col.width = w;
    col.alignment = { vertical: 'top', wrapText: true };
  }

  const borderEndRow = Math.min(lastRow, 1 + 2000);
  for (let r = 2; r <= borderEndRow; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= colCount; c++) {
      row.getCell(c).border = thinBorder();
    }
    if (r % 2 === 0) {
      for (let c = 1; c <= colCount; c++) {
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    }
  }
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const edge = { style: 'thin' as const, color: { argb: BORDER_LIGHT } };
  return { top: edge, left: edge, bottom: edge, right: edge };
}

function estimateColumnWidth(header: string, samples: string[]): number {
  const cap = 62;
  const floor = 10;
  let max = header.length;
  for (const s of samples) {
    const len = Math.min(s.length, 120);
    if (len > max) max = len;
  }
  const withPadding = Math.min(cap, Math.max(floor, max + 2));
  return Math.round(withPadding * 0.92 * 100) / 100;
}

function unionKeys(rows: Record<string, unknown>[]): string[] {
  const s = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) s.add(k);
  }
  return [...s].sort();
}

function cellToExcel(v: unknown): string | number | Date | boolean {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    return JSON.stringify(v, null, 2);
  }
  if (typeof v === 'boolean' || typeof v === 'number') return v;
  return String(v);
}

function jsonPropertyNames(meta: EntityMetadata): Set<string> {
  const s = new Set<string>();
  for (const p of Object.values(meta.properties)) {
    const colTypes = (p as { columnTypes?: string[] }).columnTypes;
    if (colTypes?.includes('json')) {
      s.add(p.name);
    }
  }
  return s;
}

function sheetToObjects(
  sheet: ExcelJS.Worksheet,
  entityMeta: EntityMetadata,
): Record<string, unknown>[] {
  if (sheet.rowCount < 2) return [];
  const headerRow = sheet.getRow(1);
  const keys: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    keys[colNumber - 1] = String(cell.value ?? '').trim();
  });
  if (keys.length === 0 || keys[0]?.startsWith('(')) return [];

  const jsonKeys = jsonPropertyNames(entityMeta);
  const out: Record<string, unknown>[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const obj: Record<string, unknown> = {};
    let empty = true;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (!key) continue;
      const cell = row.getCell(c + 1);
      let val: unknown = cell.value;
      if (val && typeof val === 'object' && 'richText' in (val as object)) {
        val = (val as { richText: { text: string }[] }).richText
          .map((t) => t.text)
          .join('');
      }
      if (val === '' || val === null || val === undefined) {
        obj[key] = null;
        continue;
      }
      empty = false;
      if (jsonKeys.has(key) && typeof val === 'string') {
        try {
          obj[key] = JSON.parse(val);
        } catch {
          obj[key] = val;
        }
      } else if (typeof val === 'string' && /^-?\d+$/.test(val.trim())) {
        obj[key] = parseInt(val, 10);
      } else if (typeof val === 'string' && /^-?\d+\.\d+$/.test(val.trim())) {
        obj[key] = Number(val);
      } else if (
        typeof val === 'string' &&
        (val.trim().startsWith('[') || val.trim().startsWith('{'))
      ) {
        try {
          obj[key] = JSON.parse(val);
        } catch {
          obj[key] = val;
        }
      } else {
        obj[key] = val;
      }
    }
    if (!empty) out.push(obj);
  }
  return out;
}
