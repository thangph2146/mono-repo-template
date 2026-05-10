import type { Order, OrderItem } from './types';

/**
 * MySQL/Mikro đôi khi trả cột JSON `items` là chuỗi đã stringify;
 * client cần mảng để `.map` an toàn.
 */
export function normalizeOrderItems(raw: unknown): OrderItem[] {
  if (Array.isArray(raw)) return raw as OrderItem[];
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t) as unknown;
      return Array.isArray(p) ? (p as OrderItem[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    items: normalizeOrderItems((order as Order & { items?: unknown }).items),
  };
}
