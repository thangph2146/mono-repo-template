import type { ProductUnitType } from "@/lib/api";

/**
 * Giá đang bán (`current`) và giá niêm yết / lẻ (`list`) khi có ưu đãi sỉ
 * (wholesale thấp hơn retail).
 */
export function unitSellingAndListPrice(unit: ProductUnitType): {
  current: number;
  list: number | null;
} {
  const retail = Number(unit.retailPrice);
  const w = unit.wholesalePrice;
  const wholesale = w === null || w === undefined ? null : Number(w);
  if (wholesale !== null && Number.isFinite(wholesale) && wholesale < retail) {
    return { current: wholesale, list: retail };
  }
  return { current: retail, list: null };
}
