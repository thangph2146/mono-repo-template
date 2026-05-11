/**
 * Quy tắc mã khuyến mãi — dùng chung storefront + API khi tạo đơn.
 * Giữ logic đồng bộ: mọi thay đổi phải áp dụng cho cả hai phía.
 */

function formatMoneyVi(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`;
}

export type PromoResult =
  | {
      ok: true;
      discount: number;
      normalizedCode: string;
      label: string;
    }
  | { ok: false; message: string };

/** Dòng hàng (tuỳ mã có điều kiện theo đơn vị). */
export type PromoCartLine = {
  unitType: string;
  quantity: number;
};

export type ApplyPromoOptions = {
  cartLines?: PromoCartLine[] | null;
  /**
   * Số tiền giảm đã áp trước (dự phòng). Mã % / giảm cố định tính trên
   * `max(0, subtotal - preAppliedDiscount)`; điều kiện đơn tối thiểu (GIAM50K…) vẫn
   * dùng `subtotal` gốc.
   */
  preAppliedDiscount?: number;
};

function discountBasis(
  subtotal: number,
  preAppliedDiscount: number | undefined,
): number {
  return Math.max(0, Math.floor(subtotal - Math.max(0, preAppliedDiscount ?? 0)));
}

/** Cách tính giảm — khớp cột `discountKind` trên API. */
export type PromoDiscountKind = 'fixed' | 'percent';

/**
 * Rule tối giản để áp dụng mã (đủ cho client + server; không chứa usage).
 * `code` luôn so khớp sau khi trim + uppercase.
 */
export type PromoRulePublic = {
  code: string;
  label: string;
  discountKind: PromoDiscountKind;
  /** VND — khi `discountKind === 'fixed'`. */
  discountFixed: number;
  /** 0–100 — khi `discountKind === 'percent'`. */
  discountPercent: number;
  /** Trần giảm (VND) cho %; `null` = không trần. */
  discountCapVnd: number | null;
  /** Tạm tính tối thiểu (VND); `0` = không yêu cầu. */
  minOrderSubtotal: number;
};

/** Mặc định khi DB chưa seed — vẫn demo được trên local. */
export const BUILTIN_PROMO_RULES: readonly PromoRulePublic[] = [
  {
    code: 'GIAM50K',
    label: 'Giảm 50.000đ (GIAM50K)',
    discountKind: 'fixed',
    discountFixed: 50_000,
    discountPercent: 0,
    discountCapVnd: null,
    minOrderSubtotal: 200_000,
  },
  {
    code: 'SYNC10',
    label: 'Giảm 10% (tối đa 200.000đ) — SYNC10',
    discountKind: 'percent',
    discountFixed: 0,
    discountPercent: 10,
    discountCapVnd: 200_000,
    minOrderSubtotal: 0,
  },
  {
    code: 'WELCOME30',
    label: 'Giảm 30.000đ (WELCOME30)',
    discountKind: 'fixed',
    discountFixed: 30_000,
    discountPercent: 0,
    discountCapVnd: null,
    minOrderSubtotal: 150_000,
  },
] as const;

/** Gợi ý placeholder form — lấy từ bộ mặc định. */
export const PROMO_CODE_EXAMPLES = BUILTIN_PROMO_RULES.map((r) => r.code);

/** Gộp: rule DB trùng `code` ghi đè rule built-in. */
export function mergePromoRulesPreferDb(
  dbRules: readonly PromoRulePublic[],
): PromoRulePublic[] {
  const m = new Map<string, PromoRulePublic>();
  for (const r of BUILTIN_PROMO_RULES) {
    m.set(r.code.trim().toUpperCase(), { ...r });
  }
  for (const r of dbRules) {
    m.set(r.code.trim().toUpperCase(), { ...r });
  }
  return [...m.values()];
}

function computeDiscountForRule(
  rule: PromoRulePublic,
  subtotal: number,
  basis: number,
): { discount: number } | { error: string } {
  const minOrder = Math.max(0, Math.floor(rule.minOrderSubtotal ?? 0));
  if (subtotal < minOrder) {
    return {
      error: `Mã ${rule.code} áp dụng cho đơn từ ${formatMoneyVi(minOrder)}.`,
    };
  }

  if (basis <= 0) {
    return { error: 'Không còn phần tạm tính để áp mã.' };
  }

  if (rule.discountKind === 'fixed') {
    const fixed = Math.max(0, Math.floor(rule.discountFixed ?? 0));
    const discount = Math.min(fixed, basis);
    if (discount <= 0) {
      return { error: 'Không còn phần tạm tính để áp mã.' };
    }
    return { discount };
  }

  const pct = Math.max(0, Math.min(100, Math.floor(rule.discountPercent ?? 0)));
  if (pct <= 0) {
    return { error: 'Cấu hình mã % không hợp lệ.' };
  }
  const raw = Math.floor((basis * pct) / 100);
  const cap =
    rule.discountCapVnd != null && Number.isFinite(rule.discountCapVnd)
      ? Math.max(0, Math.floor(rule.discountCapVnd))
      : Number.POSITIVE_INFINITY;
  const discount = Math.min(raw, cap, basis);
  if (discount <= 0) {
    return { error: 'Không còn phần tạm tính để áp mã.' };
  }
  return { discount };
}

/**
 * Tính số tiền giảm từ mã (VND, số nguyên) theo danh sách rule (DB + có thể merge built-in).
 */
export function applyPromoCodeWithRules(
  subtotal: number,
  rawCode: string | null | undefined,
  rules: readonly PromoRulePublic[],
  options?: ApplyPromoOptions,
): PromoResult {
  const code = rawCode?.trim().toUpperCase();
  if (!code) {
    return { ok: false, message: 'Vui lòng nhập mã khuyến mãi.' };
  }
  if (subtotal <= 0) {
    return { ok: false, message: 'Chưa có tạm tính để áp dụng mã.' };
  }

  const pre = Math.max(0, Math.floor(options?.preAppliedDiscount ?? 0));
  const basis = discountBasis(subtotal, pre);

  const rule = rules.find((r) => r.code.trim().toUpperCase() === code);
  if (!rule) {
    return {
      ok: false,
      message: 'Mã không hợp lệ hoặc đã ngừng áp dụng.',
    };
  }

  const out = computeDiscountForRule(rule, subtotal, basis);
  if ('error' in out) {
    return { ok: false, message: out.error };
  }

  return {
    ok: true,
    discount: out.discount,
    normalizedCode: code,
    label: rule.label || `Giảm ${formatMoneyVi(out.discount)} (${code})`,
  };
}

/**
 * Tính số tiền giảm — dùng bộ rule mặc định (không gọi API).
 * @deprecated Ưu tiên `applyPromoCodeWithRules` + rule từ API; giữ để tương thích.
 */
export function applyPromoCode(
  subtotal: number,
  rawCode: string | null | undefined,
  options?: ApplyPromoOptions,
): PromoResult {
  return applyPromoCodeWithRules(subtotal, rawCode, BUILTIN_PROMO_RULES, options);
}
