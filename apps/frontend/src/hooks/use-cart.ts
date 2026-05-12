"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  applyPromoCodeWithRules,
  type PromoResult,
} from "@workspace/promo-codes";
import { getMergedPromoRules } from "@/lib/promo-rules-registry";
import { effectiveLineUnitPrice } from "@workspace/api-client";
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
  /** Giá đang áp dụng theo SL (KM khi đủ minPromoQty). */
  unitPrice: number;
  /** Giá ban đầu cùng đơn vị (retail). */
  listUnitPrice: number;
  /** Giá KM trên đơn vị (wholesale < retail); null = không có tier KM. */
  promoUnitPrice: number | null;
  /** SL tối thiểu để áp promoUnitPrice (minWholesaleQty). */
  minPromoQty: number;
  qtyPerUnit: number;
  quantity: number;
  isWholesale: boolean;
  stock: number;
  /**
   * Ghi chú kho / quà KM (`Product.fulfillmentNote`) — cập nhật khi thêm SP;
   * parser quà đọc chung với CTSP.
   */
  fulfillmentNote?: string | null;
}

interface CartState {
  lines: CartLine[];
  appliedPromoCode: string | null;
}

const initialState: CartState = { lines: [], appliedPromoCode: null };

/** Khóa gộp dòng: cùng sản phẩm + cùng loại đơn vị (trim). */
export function cartLineKey(productId: number, unitType: string): string {
  return `${productId}:${String(unitType).trim()}`;
}

/** SL trong giỏ (cùng SP + loại đơn vị), để preview giá khi cộng với SL đang chọn trên catalog/CTSP. */
export function cartLineQuantity(
  lines: readonly CartLine[],
  productId: number,
  unitType: string,
): number {
  const key = cartLineKey(productId, unitType);
  const line = lines.find(
    (l) => cartLineKey(l.productId, l.unitType) === key,
  );
  return line ? Math.max(0, Math.floor(line.quantity)) : 0;
}

function repriceLine(line: CartLine): CartLine {
  const retail = Math.max(
    0,
    Math.floor(line.listUnitPrice ?? line.unitPrice),
  );
  const promoRaw = line.promoUnitPrice;
  const promo =
    promoRaw === null || promoRaw === undefined || !Number.isFinite(promoRaw)
      ? null
      : Math.floor(promoRaw);
  const minQ = Math.max(0, Math.floor(line.minPromoQty ?? 0));

  if (promo === null || promo <= 0 || promo >= retail) {
    return {
      ...line,
      listUnitPrice: retail,
      unitPrice: retail,
      promoUnitPrice: null,
      minPromoQty: minQ,
      isWholesale: false,
    };
  }

  const eff = effectiveLineUnitPrice(
    {
      retailPrice: retail,
      wholesalePrice: promo,
      minWholesaleQty: minQ,
    },
    line.quantity,
  );
  return {
    ...line,
    listUnitPrice: eff.listUnitPrice,
    unitPrice: eff.unitPrice,
    promoUnitPrice: promo,
    minPromoQty: minQ,
    isWholesale: eff.isSaleActive,
  };
}

function mergeDuplicateCartLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const l of lines) {
    const key = cartLineKey(l.productId, l.unitType);
    const prev = map.get(key);
    if (!prev) {
      map.set(
        key,
        repriceLine(
          clamp({
            ...l,
            unitType: String(l.unitType).trim(),
            quantity: Math.max(1, Math.floor(l.quantity)),
          }),
        ),
      );
    } else {
      prev.quantity =
        Math.max(1, prev.quantity) + Math.max(1, Math.floor(l.quantity));
      prev.unitLabel = l.unitLabel;
      prev.qtyPerUnit = l.qtyPerUnit;
      prev.stock = l.stock;
      prev.promoUnitPrice = l.promoUnitPrice;
      prev.minPromoQty = l.minPromoQty;
      prev.listUnitPrice = l.listUnitPrice;
      prev.fulfillmentNote = l.fulfillmentNote ?? prev.fulfillmentNote;
      if (l.image) prev.image = l.image;
      map.set(key, repriceLine(clamp(prev)));
    }
  }
  return [...map.values()];
}

/** Gộp dòng trùng trước khi POST tạo đơn (phòng trùng từ client). */
export function mergeLinesForCreateOrder(
  lines: CartLine[],
): Array<{ productId: number; quantity: number; unitType: string }> {
  const map = new Map<
    string,
    { productId: number; quantity: number; unitType: string }
  >();
  for (const l of lines) {
    const ut = String(l.unitType).trim();
    const key = cartLineKey(l.productId, ut);
    const prev = map.get(key);
    const q = Math.max(1, Math.floor(l.quantity));
    if (prev) prev.quantity += q;
    else map.set(key, { productId: l.productId, quantity: q, unitType: ut });
  }
  return [...map.values()];
}

function isCartLineCore(value: unknown): boolean {
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
    if (!isCartLineCore(item)) continue;
    const row = item as Record<string, unknown> & CartLine;
    const listUnitPrice =
      typeof row.listUnitPrice === "number" && Number.isFinite(row.listUnitPrice)
        ? Math.max(0, Math.floor(row.listUnitPrice))
        : Math.max(0, Math.floor(row.unitPrice));

    let promoUnitPrice: number | null = null;
    if (
      typeof row.promoUnitPrice === "number" &&
      Number.isFinite(row.promoUnitPrice)
    ) {
      promoUnitPrice = Math.floor(row.promoUnitPrice);
    } else if (listUnitPrice > Math.floor(row.unitPrice)) {
      promoUnitPrice = Math.floor(row.unitPrice);
    }

    let minPromoQty = 0;
    if (
      typeof row.minPromoQty === "number" &&
      Number.isFinite(row.minPromoQty)
    ) {
      minPromoQty = Math.max(0, Math.floor(row.minPromoQty));
    }

    const base: CartLine = {
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      image: row.image,
      category: row.category,
      unitType: String(row.unitType).trim(),
      unitLabel: row.unitLabel,
      unitPrice: row.unitPrice,
      listUnitPrice,
      promoUnitPrice,
      minPromoQty,
      qtyPerUnit: row.qtyPerUnit,
      quantity: Math.max(1, Math.floor(row.quantity)),
      isWholesale: row.isWholesale,
      stock: row.stock,
      fulfillmentNote:
        typeof row.fulfillmentNote === "string"
          ? row.fulfillmentNote
          : null,
    };
    out.push(repriceLine(clamp(base)));
  }
  let appliedPromoCode: string | null = null;
  if (typeof o.appliedPromoCode === "string" && o.appliedPromoCode.trim()) {
    appliedPromoCode = o.appliedPromoCode.trim().toUpperCase();
  }
  return { lines: mergeDuplicateCartLines(out), appliedPromoCode };
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

function computeSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

const lineFromUnit = (
  product: Product,
  unit: ProductUnitType,
  quantity: number,
): CartLine => {
  const retail = Math.max(0, Math.floor(Number(unit.retailPrice) || 0));
  const rawW = unit.wholesalePrice;
  const promo =
    rawW === null || rawW === undefined || !Number.isFinite(Number(rawW))
      ? null
      : Math.floor(Number(rawW));
  const hasPromo = promo !== null && promo > 0 && promo < retail;
  const minPromoQty = Math.max(0, Math.floor(Number(unit.minWholesaleQty) || 0));
  const eff = effectiveLineUnitPrice(
    {
      retailPrice: retail,
      wholesalePrice: hasPromo ? promo : null,
      minWholesaleQty: minPromoQty,
    },
    quantity,
  );
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    image: product.images?.[0],
    category: product.category,
    unitType: String(unit.type).trim(),
    unitLabel: unit.label,
    unitPrice: eff.unitPrice,
    listUnitPrice: eff.listUnitPrice,
    promoUnitPrice: hasPromo ? promo : null,
    minPromoQty,
    qtyPerUnit: unit.qtyPerUnit,
    quantity,
    isWholesale: eff.isSaleActive,
    stock: product.stock,
    fulfillmentNote: product.fulfillmentNote ?? null,
  };
};

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
    const key = cartLineKey(product.id, unit.type);
    const existing = next.lines.find(
      (l) => cartLineKey(l.productId, l.unitType) === key,
    );
    if (existing) {
      existing.quantity += quantity;
      existing.unitLabel = unit.label;
      existing.qtyPerUnit = unit.qtyPerUnit;
      existing.stock = product.stock;
      existing.fulfillmentNote = product.fulfillmentNote ?? existing.fulfillmentNote;
      const fresh = lineFromUnit(product, unit, existing.quantity);
      existing.listUnitPrice = fresh.listUnitPrice;
      existing.promoUnitPrice = fresh.promoUnitPrice;
      existing.minPromoQty = fresh.minPromoQty;
      Object.assign(existing, repriceLine(clamp(existing)));
    } else {
      next.lines.push(repriceLine(clamp(lineFromUnit(product, unit, quantity))));
    }
    write(next);
  },
  setQuantity(productId: number, unitType: string, quantity: number): void {
    const next = read();
    const idx = next.lines.findIndex(
      (l) =>
        cartLineKey(l.productId, l.unitType) ===
        cartLineKey(productId, unitType),
    );
    if (idx === -1) return;
    if (quantity <= 0) {
      next.lines.splice(idx, 1);
    } else {
      const updated = repriceLine(
        clamp({ ...next.lines[idx]!, quantity }),
      );
      next.lines[idx] = updated;
    }
    write(next);
  },
  remove(productId: number, unitType: string): void {
    const next = read();
    next.lines = next.lines.filter(
      (l) =>
        cartLineKey(l.productId, l.unitType) !==
        cartLineKey(productId, unitType),
    );
    write(next);
  },
  clear(): void {
    write({ lines: [], appliedPromoCode: null });
  },
  applyPromo(raw: string): PromoResult {
    const next = read();
    const subtotal = computeSubtotal(next.lines);
    const cartLines = next.lines.map((l) => ({
      unitType: l.unitType,
      quantity: l.quantity,
    }));
    const result = applyPromoCodeWithRules(
      subtotal,
      raw,
      getMergedPromoRules(),
      {
        cartLines,
        preAppliedDiscount: 0,
      },
    );
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
  /** Tạm tính theo giá đang áp dụng (KM theo đơn vị + SL). */
  subtotal: number;
  /** So với giá ban đầu cùng đơn vị (chỉ hiển thị khi > 0). */
  wholesaleSavings: number;
  appliedPromoCode: string | null;
  promoDiscount: number;
  promoLabel: string | null;
  /** Mã đang lưu nhưng không đủ điều kiện sau khi đổi giỏ. */
  promoError: string | null;
  /** Thành tiền tạm (sau mã coupon nếu có; KM đơn vị đã nằm trong tạm tính). */
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

  const cartLines = lines.map((l) => ({
    unitType: l.unitType,
    quantity: l.quantity,
  }));

  const appliedPromoCode = state.appliedPromoCode;
  const promoEval = appliedPromoCode
    ? applyPromoCodeWithRules(
        subtotal,
        appliedPromoCode,
        getMergedPromoRules(),
        {
          cartLines,
          preAppliedDiscount: 0,
        },
      )
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
