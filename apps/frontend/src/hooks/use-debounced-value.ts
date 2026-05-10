"use client";

import { useEffect, useState } from "react";

/**
 * Trì hoãn cập nhật giá trị (tìm kiếm, sync URL) để giảm render / request.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
