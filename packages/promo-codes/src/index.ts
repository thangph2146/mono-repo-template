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

/** Gợi ý hiển thị trên form (mã nhập tay). Giá KM theo đơn vị do kho cấu hình — không phải mã. */
export const PROMO_CODE_EXAMPLES = ['GIAM50K', 'SYNC10', 'WELCOME30'] as const;

/**
 * Tính số tiền giảm từ mã (VND, số nguyên). Không vượt quá phần còn lại sau `preAppliedDiscount`.
 */
export function applyPromoCode(
  subtotal: number,
  rawCode: string | null | undefined,
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

  switch (code) {
    case 'GIAM50K': {
      const minOrder = 200_000;
      if (subtotal < minOrder) {
        return {
          ok: false,
          message: `Mã GIAM50K áp dụng cho đơn từ ${formatMoneyVi(minOrder)}.`,
        };
      }
      const discount = Math.min(50_000, basis);
      if (discount <= 0) {
        return {
          ok: false,
          message: 'Không còn phần tạm tính để áp mã.',
        };
      }
      return {
        ok: true,
        discount,
        normalizedCode: code,
        label: 'Giảm 50.000đ (GIAM50K)',
      };
    }
    case 'SYNC10': {
      if (basis <= 0) {
        return {
          ok: false,
          message: 'Không còn phần tạm tính để áp SYNC10.',
        };
      }
      const raw = Math.floor(basis * 0.1);
      const cap = 200_000;
      const discount = Math.min(raw, cap, basis);
      return {
        ok: true,
        discount,
        normalizedCode: code,
        label: 'Giảm 10% (tối đa 200.000đ) — SYNC10',
      };
    }
    case 'WELCOME30': {
      const minOrder = 150_000;
      if (subtotal < minOrder) {
        return {
          ok: false,
          message: `Mã WELCOME30 áp dụng cho đơn từ ${formatMoneyVi(minOrder)}.`,
        };
      }
      const discount = Math.min(30_000, basis);
      if (discount <= 0) {
        return {
          ok: false,
          message: 'Không còn phần tạm tính để áp mã.',
        };
      }
      return {
        ok: true,
        discount,
        normalizedCode: code,
        label: 'Giảm 30.000đ (WELCOME30)',
      };
    }
    default:
      return {
        ok: false,
        message: 'Mã không hợp lệ hoặc đã ngừng áp dụng.',
      };
  }
}
