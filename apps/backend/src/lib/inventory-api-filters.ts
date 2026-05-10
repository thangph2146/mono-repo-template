import type { ColumnFiltersState } from "@tanstack/react-table";
import type { ProductListParams } from "@workspace/api-client";
import type { ProductTreeRow } from "@/lib/admin-inventory-tree";

/**
 * Chuyển tab + ô lọc bảng + tìm nhanh → query GET /products (lọc server).
 */
export function inventoryFiltersToProductListParams(
  tabCategory: string,
  columnFilters: ColumnFiltersState,
  globalQ: string,
): ProductListParams {
  const p: ProductListParams = {};
  const q = globalQ.trim();
  if (q) p.q = q;

  const colCategory = columnFilters.find((c) => c.id === "category")?.value;
  if (colCategory != null && String(colCategory) !== "") {
    p.category = String(colCategory);
  } else if (tabCategory !== "ALL") {
    p.category = tabCategory;
  }

  for (const f of columnFilters) {
    if (f.value == null || f.value === "") continue;
    switch (f.id) {
      case "category":
        break;
      case "brand": {
        const b = String(f.value);
        if (b === "—") p.brandEmpty = true;
        else p.brand = b;
        break;
      }
      case "stock": {
        const n = Number(f.value);
        if (Number.isFinite(n)) p.stock = n;
        break;
      }
      case "retailPrice": {
        const n = Number(f.value);
        if (Number.isFinite(n)) p.retailPrice = n;
        break;
      }
      case "isActiveLabel": {
        if (f.value === "Còn bán") p.isActive = true;
        else if (f.value === "Ngừng") p.isActive = false;
        break;
      }
      case "stockBand": {
        const v = String(f.value);
        if (v === "__line__") break;
        if (v === "Còn hàng") p.stockBand = "ok";
        else if (v === "Sắp hết") p.stockBand = "low";
        else if (v === "Hết hàng") p.stockBand = "out";
        break;
      }
      default:
        break;
    }
  }

  return p;
}

/** Chỉ dòng đơn vị: làm phẳng cây (bỏ dòng sản phẩm cha). */
export function applyInventoryLineOnlyFilter(
  rows: ProductTreeRow[],
  lineOnly: boolean,
): ProductTreeRow[] {
  if (!lineOnly) return rows;
  const out: ProductTreeRow[] = [];
  for (const r of rows) {
    if (r.rowKind === "product" && r.subRows?.length) {
      out.push(...r.subRows);
    }
  }
  return out;
}

export function inventoryHasLineOnlyFilter(
  columnFilters: ColumnFiltersState,
): boolean {
  const v = columnFilters.find((c) => c.id === "stockBand")?.value;
  return v === "__line__";
}
