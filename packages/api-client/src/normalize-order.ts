import type { Order, OrderItem } from './types';

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** Chuẩn hóa một dòng hàng: số từ DB/driver JSON đôi khi là chuỗi. */
function normalizeOneItem(row: unknown): OrderItem | null {
  if (!row || typeof row !== 'object') return null;
  const o = row as Record<string, unknown>;
  const productId = toNum(o.productId, NaN);
  if (!Number.isFinite(productId)) return null;
  const sku = typeof o.sku === 'string' ? o.sku : String(o.sku ?? '');
  const name = typeof o.name === 'string' ? o.name : String(o.name ?? '');
  const unitType = typeof o.unitType === 'string' ? o.unitType : String(o.unitType ?? '');
  const quantity = Math.max(0, Math.floor(toNum(o.quantity, 0)));
  if (quantity <= 0) return null;
  const unitPrice = toNum(o.unitPrice, 0);
  const totalPrice = toNum(o.totalPrice, unitPrice * quantity);
  const item: OrderItem = {
    productId,
    sku,
    name,
    quantity,
    unitType,
    unitPrice,
    totalPrice,
    qtyPerUnit:
      o.qtyPerUnit === undefined || o.qtyPerUnit === null
        ? undefined
        : Math.max(1, Math.floor(toNum(o.qtyPerUnit, 1))),
    image: typeof o.image === 'string' ? o.image : undefined,
    giftNote: typeof o.giftNote === 'string' ? o.giftNote : undefined,
    listUnitPrice:
      o.listUnitPrice === undefined || o.listUnitPrice === null
        ? undefined
        : toNum(o.listUnitPrice),
    unitLabel: typeof o.unitLabel === 'string' ? o.unitLabel : undefined,
  };
  return item;
}

/**
 * MySQL/Mikro đôi khi trả cột JSON `items` là chuỗi đã stringify;
 * client cần mảng để `.map` an toàn.
 */
export function normalizeOrderItems(raw: unknown): OrderItem[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t) as unknown;
      arr = Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  const out: OrderItem[] = [];
  for (const row of arr) {
    const n = normalizeOneItem(row);
    if (n) out.push(n);
  }
  return out;
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    items: normalizeOrderItems((order as Order & { items?: unknown }).items),
  };
}
