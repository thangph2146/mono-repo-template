/**
 * Parse điều kiện quà tặng từ `Product.fulfillmentNote` (định dạng do kho/backend quản lý).
 * Giữ parser tập trung một chỗ để CTSP, giỏ, checkout cùng đọc một nguồn.
 */

export type GiftRule = {
  minQty: number;
  unitType: string;
  giftQty: number;
  giftName: string;
  giftSku: string;
  giftUnitType: string;
};

/** Chuẩn hoá để khớp `unitType` trong note với `ProductUnitType.type` trên giỏ. */
export function normalizeGiftRuleUnitType(raw: string): string {
  return raw.trim().toLocaleLowerCase("vi");
}

/**
 * Mỗi dòng note có dạng:
 * `- Từ {n} {unitType}: tặng {qty} {tên quà} (SKU: …) - đơn vị quà: …`.
 */
export function parseGiftRulesFromFulfillmentNote(
  note: string | null | undefined,
): GiftRule[] {
  if (!note) return [];
  const out: GiftRule[] = [];
  for (const rawLine of note.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("- Từ ")) continue;
    const m = line.match(/^- Từ\s+(\d+)\s+(.+?):\s+tặng\s+(\d+)\s+(.+)\.$/);
    if (!m) continue;

    const minQty = Math.max(1, Number(m[1]) || 1);
    const unitType = m[2].trim();
    const giftQty = Math.max(1, Number(m[3]) || 1);

    let giftPayload = m[4].trim();
    let giftUnitType = "";
    let giftSku = "";

    const unitMarker = " - đơn vị quà: ";
    const unitAt = giftPayload.lastIndexOf(unitMarker);
    if (unitAt >= 0) {
      giftUnitType = giftPayload.slice(unitAt + unitMarker.length).trim();
      giftPayload = giftPayload.slice(0, unitAt).trim();
    }

    const skuMatch = giftPayload.match(/\(SKU:\s*([^)]+)\)\s*$/);
    if (skuMatch) {
      giftSku = skuMatch[1].trim();
      giftPayload = giftPayload.slice(0, skuMatch.index).trim();
    }

    const giftName = giftPayload.trim();
    if (!giftName) continue;

    out.push({ minQty, unitType, giftQty, giftName, giftSku, giftUnitType });
  }
  return out;
}

/** Quà áp cho đúng loại đơn vị dòng giỏ / đơn vị đang xem trên CTSP. */
export function getActiveGiftRuleForUnit(
  fulfillmentNote: string | null | undefined,
  cartOrSelectedUnitType: string,
): GiftRule | null {
  const rules = parseGiftRulesFromFulfillmentNote(fulfillmentNote);
  const key = normalizeGiftRuleUnitType(cartOrSelectedUnitType);
  return (
    rules.find(
      (r) => normalizeGiftRuleUnitType(r.unitType) === key,
    ) ?? null
  );
}
