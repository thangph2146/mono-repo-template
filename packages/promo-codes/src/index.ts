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

/** Gợi ý hiển thị trên form (mã demo). */
export const PROMO_CODE_EXAMPLES = ['GIAM50K', 'SYNC10', 'WELCOME30'] as const;

/**
 * Tính số tiền giảm từ mã (VND, số nguyên). Không vượt quá tạm tính.
 */
export function applyPromoCode(
  subtotal: number,
  rawCode: string | null | undefined,
): PromoResult {
  const code = rawCode?.trim().toUpperCase();
  if (!code) {
    return { ok: false, message: 'Vui lòng nhập mã khuyến mãi.' };
  }
  if (subtotal <= 0) {
    return { ok: false, message: 'Chưa có tạm tính để áp dụng mã.' };
  }

  switch (code) {
    case 'GIAM50K': {
      const minOrder = 200_000;
      if (subtotal < minOrder) {
        return {
          ok: false,
          message: `Mã GIAM50K áp dụng cho đơn từ ${formatMoneyVi(minOrder)}.`,
        };
      }
      const discount = Math.min(50_000, subtotal);
      return {
        ok: true,
        discount,
        normalizedCode: code,
        label: 'Giảm 50.000đ (GIAM50K)',
      };
    }
    case 'SYNC10': {
      const raw = Math.floor(subtotal * 0.1);
      const cap = 200_000;
      const discount = Math.min(raw, cap, subtotal);
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
      const discount = Math.min(30_000, subtotal);
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
