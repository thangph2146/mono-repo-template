"use client";

import { useCallback, useSyncExternalStore } from "react";
import { applyPromoCode, type PromoResult } from "@workspace/promo-codes";
import type { Product, ProductUnitType } from "@/lib/api";

const STORAGE_KEY = "storesync_cart_v1";

export interface CartLine {
  productId: number;
  sku: string;
  name: string;
  image?: string;
  category: string;
  unitType: string;
  unitLabel: string;
  /** Giá đang áp dụng (sỉ hoặc lẻ theo đơn vị). */
  unitPrice: number;
  /**
   * Giá niêm yết lẻ theo cùng đơn vị (từ `unit.retailPrice`), để hiển thị tiết kiệm khi mua sỉ.
   */
  listUnitPrice?: number;
  qtyPerUnit: number;
  quantity: number;
  isWholesale: boolean;
  stock: number;
}

interface CartState {
  lines: CartLine[];
  appliedPromoCode: string | null;
}

const initialState: CartState = { lines: [], appliedPromoCode: null };

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.productId === "number" &&
    typeof o.sku === "string" &&
    typeof o.name === "string" &&
    typeof o.category === "string" &&
    typeof o.unitType === "string" &&
    typeof o.unitLabel === "string" &&
    typeof o.unitPrice === "number" &&
    typeof o.qtyPerUnit === "number" &&
    typeof o.quantity === "number" &&
    typeof o.isWholesale === "boolean" &&
    typeof o.stock === "number"
  );
}

function normalizeCartState(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") {
    return { lines: [], appliedPromoCode: null };
  }
  const o = raw as Record<string, unknown>;
  const linesRaw = o.lines;
  const linesIn = Array.isArray(linesRaw) ? linesRaw : [];
  const out: CartLine[] = [];
  for (const item of linesIn) {
    if (!isCartLine(item)) continue;
    const listUnitPrice =
      typeof item.listUnitPrice === "number" && Number.isFinite(item.listUnitPrice)
        ? item.listUnitPrice
        : item.unitPrice;
    out.push({
      ...item,
      listUnitPrice,
      quantity: Math.max(1, Math.floor(item.quantity)),
    });
  }
  let appliedPromoCode: string | null = null;
  if (typeof o.appliedPromoCode === "string" && o.appliedPromoCode.trim()) {
    appliedPromoCode = o.appliedPromoCode.trim().toUpperCase();
  }
  return { lines: out, appliedPromoCode };
}

const isClient = typeof window !== "undefined";

const subscribers = new Set<() => void>();
let snapshot: CartState = initialState;

const read = (): CartState => {
  if (!isClient) return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], appliedPromoCode: null };
    const parsed = JSON.parse(raw) as unknown;
    return normalizeCartState(parsed);
  } catch {
    return { lines: [], appliedPromoCode: null };
  }
};

const notify = (): void => {
  for (const cb of subscribers) cb();
};

const write = (next: CartState): void => {
  snapshot = next;
  if (isClient) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage might be full or disabled (private mode); the in-memory
      // snapshot is still updated so the UI stays consistent for the session.
    }
  }
  notify();
};

let crossTabBound = false;
const bindCrossTab = (): void => {
  if (!isClient || crossTabBound) return;
  crossTabBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    snapshot = read();
    notify();
  });
};

const subscribe = (cb: () => void): (() => void) => {
  subscribers.add(cb);
  bindCrossTab();
  return () => {
    subscribers.delete(cb);
  };
};

if (isClient) {
  snapshot = read();
}

const cartKey = (productId: number, unitType: string): string =>
  `${productId}:${unitType}`;

function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

const lineFromUnit = (
  product: Product,
  unit: ProductUnitType,
  quantity: number,
): CartLine => ({
  productId: product.id,
  sku: product.sku,
  name: product.name,
  image: product.images?.[0],
  category: product.category,
  unitType: unit.type,
  unitLabel: unit.label,
  unitPrice: unit.wholesalePrice ?? unit.retailPrice,
  listUnitPrice: unit.retailPrice,
  qtyPerUnit: unit.qtyPerUnit,
  quantity,
  isWholesale: unit.wholesalePrice !== null,
  stock: product.stock,
});

const clamp = (line: CartLine): CartLine => {
  const maxByStock = Math.max(
    1,
    Math.floor(line.stock / Math.max(line.qtyPerUnit, 1)),
  );
  const next = Math.max(1, Math.min(line.quantity, maxByStock));
  return { ...line, quantity: next };
};

export const cartStore = {
  getState: (): CartState => snapshot,
  /** Ghi đè giỏ (sau khi pull từ server). */
  replaceState(raw: unknown): void {
    write(normalizeCartState(raw));
  },
  add(product: Product, unit: ProductUnitType, quantity: number): void {
    if (quantity <= 0) return;
    const next = read();
    const key = cartKey(product.id, unit.type);
    const existing = next.lines.find(
      (l) => cartKey(l.productId, l.unitType) === key,
    );
    if (existing) {
      existing.quantity += quantity;
      existing.unitPrice = unit.wholesalePrice ?? unit.retailPrice;
      existing.listUnitPrice = unit.retailPrice;
      existing.qtyPerUnit = unit.qtyPerUnit;
      existing.stock = product.stock;
      existing.isWholesale = unit.wholesalePrice !== null;
      Object.assign(existing, clamp(existing));
    } else {
      next.lines.push(clamp(lineFromUnit(product, unit, quantity)));
    }
    write(next);
  },
  setQuantity(productId: number, unitType: string, quantity: number): void {
    const next = read();
    const idx = next.lines.findIndex(
      (l) => cartKey(l.productId, l.unitType) === cartKey(productId, unitType),
    );
    if (idx === -1) return;
    if (quantity <= 0) {
      next.lines.splice(idx, 1);
    } else {
      const updated = clamp({ ...next.lines[idx]!, quantity });
      next.lines[idx] = updated;
    }
    write(next);
  },
  remove(productId: number, unitType: string): void {
    const next = read();
    next.lines = next.lines.filter(
      (l) => cartKey(l.productId, l.unitType) !== cartKey(productId, unitType),
    );
    write(next);
  },
  clear(): void {
    write({ lines: [], appliedPromoCode: null });
  },
  applyPromo(raw: string): PromoResult {
    const next = read();
    const subtotal = computeSubtotal(next.lines);
    const result = applyPromoCode(subtotal, raw);
    if (!result.ok) return result;
    next.appliedPromoCode = result.normalizedCode;
    write(next);
    return result;
  },
  clearPromo(): void {
    const next = read();
    next.appliedPromoCode = null;
    write(next);
  },
};

export interface CartSummary {
  lines: CartLine[];
  itemCount: number;
  unitCount: number;
  /** Tạm tính theo giá đang áp dụng (sỉ/lẻ). */
  subtotal: number;
  /** So với giá lẻ cùng đơn vị (chỉ hiển thị khi > 0). */
  wholesaleSavings: number;
  appliedPromoCode: string | null;
  promoDiscount: number;
  promoLabel: string | null;
  /** Mã đang lưu nhưng không đủ điều kiện sau khi đổi giỏ. */
  promoError: string | null;
  /** Thành tiền tạm (sau mã KM, trước phí ship). */
  grandTotal: number;
  /** Mã gửi lên API khi đặt hàng (chỉ khi hợp lệ). */
  couponCodeForOrder: string | undefined;
  add: (product: Product, unit: ProductUnitType, quantity?: number) => void;
  setQuantity: (productId: number, unitType: string, quantity: number) => void;
  remove: (productId: number, unitType: string) => void;
  clear: () => void;
  applyPromo: (raw: string) => PromoResult;
  clearPromo: () => void;
}

export function useCart(): CartSummary {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initialState,
  );

  const add = useCallback(
    (product: Product, unit: ProductUnitType, quantity = 1) =>
      cartStore.add(product, unit, quantity),
    [],
  );
  const setQuantity = useCallback(
    (productId: number, unitType: string, quantity: number) =>
      cartStore.setQuantity(productId, unitType, quantity),
    [],
  );
  const remove = useCallback(
    (productId: number, unitType: string) =>
      cartStore.remove(productId, unitType),
    [],
  );
  const clear = useCallback(() => cartStore.clear(), []);
  const applyPromo = useCallback((raw: string) => cartStore.applyPromo(raw), []);
  const clearPromo = useCallback(() => cartStore.clearPromo(), []);

  const lines = state.lines;
  const itemCount = lines.length;
  const unitCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = computeSubtotal(lines);
  const wholesaleSavings = lines.reduce((sum, l) => {
    const list = l.listUnitPrice ?? l.unitPrice;
    return sum + Math.max(0, list - l.unitPrice) * l.quantity;
  }, 0);

  const appliedPromoCode = state.appliedPromoCode;
  const promoEval = appliedPromoCode
    ? applyPromoCode(subtotal, appliedPromoCode)
    : null;
  const promoDiscount = promoEval?.ok === true ? promoEval.discount : 0;
  const promoLabel = promoEval?.ok === true ? promoEval.label : null;
  const promoError =
    appliedPromoCode && promoEval?.ok === false ? promoEval.message : null;
  const grandTotal = Math.max(0, subtotal - promoDiscount);
  const couponCodeForOrder =
    appliedPromoCode && promoEval?.ok === true
      ? promoEval.normalizedCode
      : undefined;

  return {
    lines,
    itemCount,
    unitCount,
    subtotal,
    wholesaleSavings,
    appliedPromoCode,
    promoDiscount,
    promoLabel,
    promoError,
    grandTotal,
    couponCodeForOrder,
    add,
    setQuantity,
    remove,
    clear,
    applyPromo,
    clearPromo,
  };
}
