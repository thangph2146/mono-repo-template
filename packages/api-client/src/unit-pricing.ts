import type { ProductUnitType } from './types';

/**
 * Giá một dòng giỏ / đơn hàng theo đơn vị: giá ban đầu (`retailPrice`) và giá KM
 * (`wholesalePrice` thấp hơn retail) chỉ áp khi `quantity` đủ `minWholesaleQty`.
 * Mỗi sản phẩm / mỗi dòng đơn vị có quy tắc riêng — không gộp với SP khác.
 */
export function effectiveLineUnitPrice(
  unit: Pick<ProductUnitType, 'retailPrice' | 'wholesalePrice' | 'minWholesaleQty'>,
  quantity: number,
): { unitPrice: number; listUnitPrice: number; isSaleActive: boolean } {
  const retail = Math.max(0, Math.floor(Number(unit.retailPrice) || 0));
  const rawW = unit.wholesalePrice;
  const wholesaleNum =
    rawW === null || rawW === undefined || !Number.isFinite(Number(rawW))
      ? null
      : Math.floor(Number(rawW));
  const minQ = Math.max(0, Math.floor(Number(unit.minWholesaleQty) || 0));
  const q = Math.max(1, Math.floor(quantity));

  if (
    wholesaleNum === null ||
    wholesaleNum <= 0 ||
    wholesaleNum >= retail
  ) {
    return { unitPrice: retail, listUnitPrice: retail, isSaleActive: false };
  }

  const eligible = minQ <= 0 ? true : q >= minQ;
  return {
    unitPrice: eligible ? wholesaleNum : retail,
    listUnitPrice: retail,
    isSaleActive: eligible,
  };
}
