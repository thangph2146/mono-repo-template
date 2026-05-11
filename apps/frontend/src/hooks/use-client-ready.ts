"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `false` khi render trên server / trước hydrate, `true` trên client.
 * Dùng thay vì `useEffect` + `setState` để tránh cảnh báo ESLint.
 */
export function useClientReady(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
