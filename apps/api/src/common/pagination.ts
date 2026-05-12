/**
 * Helper pagination dùng chung cho list API.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Chuẩn hóa page, limit và tính skip.
 * @param page - trang (>= 1)
 * @param limit - số bản ghi/trang (1..maxLimit)
 * @param maxLimit - giới hạn tối đa (mặc định 100)
 */
export function normalizePageLimit(
  page: number,
  limit: number,
  maxLimit = 100,
): PaginationParams {
  const p = Math.max(1, page);
  const l = Math.min(maxLimit, Math.max(1, limit));
  return {
    page: p,
    limit: l,
    skip: (p - 1) * l,
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Tạo object pagination cho response.
 */
export function paginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
