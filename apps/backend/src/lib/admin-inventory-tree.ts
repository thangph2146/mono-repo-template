import type { Product, ProductUnitType } from "@/lib/api";

export type ProductTreeRow =
  | {
      rowKind: "product";
      id: string;
      sku: string;
      name: string;
      category: string;
      brand: string;
      stock: number;
      unit: string;
      retailPrice: number;
      isActiveLabel: string;
      product: Product;
      subRows?: ProductTreeRow[];
    }
  | {
      rowKind: "unit";
      id: string;
      sku: string;
      name: string;
      category: string;
      brand: string;
      stock: number;
      unit: string;
      retailPrice: number;
      isActiveLabel: string;
      /** Tồn SP gốc — dùng lọc/cột “mức tồn” khớp với cha */
      parentStock: number;
      productId: number;
      unitRow: ProductUnitType;
    };

export function getProductSubRows(
  row: ProductTreeRow,
): ProductTreeRow[] | undefined {
  if (row.rowKind !== "product") return undefined;
  return row.subRows;
}

export function productsToTreeRows(products: Product[]): ProductTreeRow[] {
  return products.map((p) => {
    const units = p.unitTypes ?? [];
    const isActiveLabel = p.isActive ? "Còn bán" : "Ngừng";
    const subRows: ProductTreeRow[] = units.map((u, i) => ({
      rowKind: "unit",
      id: `p-${p.id}-u-${i}`,
      sku: p.sku,
      name: u.label || u.type,
      category: p.category,
      brand: p.brand ?? "—",
      stock: Math.floor(p.stock / Math.max(u.qtyPerUnit, 1)),
      unit: u.type,
      retailPrice: u.retailPrice,
      isActiveLabel,
      parentStock: p.stock,
      productId: p.id,
      unitRow: u,
    }));
    return {
      rowKind: "product",
      id: `p-${p.id}`,
      sku: p.sku,
      name: p.name,
      category: p.category,
      brand: p.brand ?? "—",
      stock: p.stock,
      unit: p.unit,
      retailPrice: p.retailPrice,
      isActiveLabel: p.isActive ? "Còn bán" : "Ngừng",
      product: p,
      subRows: subRows.length ? subRows : undefined,
    };
  });
}
