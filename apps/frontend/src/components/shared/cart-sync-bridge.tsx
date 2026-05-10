"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/hooks/use-session";
import { useCart, cartStore } from "@/hooks/use-cart";
import { pullUserCart, pushUserCart } from "@/lib/cart-sync";

/**
 * Đồng bộ giỏ với DB khi đã đăng nhập: hydrate sau khi userId đổi, debounce push khi giỏ đổi.
 */
export function CartSyncBridge(): null {
  const session = useSession();
  const { lines } = useCart();
  const userId = session && session.id ? Number(session.id) : NaN;
  const validUser = Number.isFinite(userId) && userId > 0;

  const hydratedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!validUser) {
      hydratedFor.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const remote = await pullUserCart(userId);
        if (cancelled) return;
        if (remote.lines.length > 0) {
          cartStore.replaceState({ lines: remote.lines });
        }
        hydratedFor.current = userId;
      } catch {
        hydratedFor.current = userId;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, validUser]);

  useEffect(() => {
    if (!validUser || hydratedFor.current !== userId) return;
    const state = cartStore.getState();
    const t = window.setTimeout(() => {
      void pushUserCart(userId, state).catch(() => {
        /* mạng lỗi — giữ local */
      });
    }, 700);
    return () => window.clearTimeout(t);
  }, [userId, validUser, lines]);

  return null;
}
