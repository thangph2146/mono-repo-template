"use client";

import { useEffect, useState } from "react";

/** Giá trị cập nhật sau `delayMs` kể từ lần thay đổi gần nhất. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
