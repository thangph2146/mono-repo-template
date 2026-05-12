/** Các hàm tiện ích xử lý Date an toàn cho backend. */

/**
 * Chuyển đổi một giá trị Date (hoặc string từ DB driver) sang ISO string an toàn.
 * Giúp tránh lỗi .toISOString() is not a function nếu driver trả về string thay vì Date object.
 */
export function safeIsoString(d: unknown): string | null {
  if (d == null) return null;
  if (d instanceof Date) {
    try {
      return d.toISOString();
    } catch {
      return null;
    }
  }
  if (typeof d === 'string') {
    // Nếu là string đã có định dạng ISO hoặc gần giống, trả về luôn
    // Có thể thêm regex check nếu cần khắt khe hơn
    return d;
  }
  return null;
}

/**
 * Trả về ISO string hiện tại (now) nếu giá trị input null/không hợp lệ.
 */
export function safeIsoStringNow(d: unknown): string {
  return safeIsoString(d) || new Date().toISOString();
}
