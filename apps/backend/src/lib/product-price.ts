import type { ProductUnitType } from "@workspace/api-client";
import { effectiveLineUnitPrice } from "@workspace/api-client";

/**
 * Giá hiển thị (`current`) và giá gạch (`list`) tại một số lượng dòng — khớp storefront.
 */
export function unitSellingAndListPrice(
  unit: ProductUnitType,
  quantity = 1,
): {
  current: number;
  list: number | null;
} {
  const { unitPrice, listUnitPrice, isSaleActive } = effectiveLineUnitPrice(
    unit,
    quantity,
  );
  return {
    current: unitPrice,
    list: isSaleActive && listUnitPrice > unitPrice ? listUnitPrice : null,
  };
}
