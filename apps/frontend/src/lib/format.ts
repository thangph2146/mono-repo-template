/** Format a numeric VND amount as "1.250.000đ". */
export const formatVND = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `${amount.toLocaleString("vi-VN")}đ`;
};

/** Format an ISO date as "dd/MM/yyyy HH:mm" in vi-VN. */
export const formatDate = (iso: string | Date | undefined | null): string => {
  if (!iso) return "—";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Chỉ ngày — dùng bảng tóm tắt đơn hàng. */
export const formatDateShort = (
  iso: string | Date | undefined | null,
): string => {
  if (!iso) return "—";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
