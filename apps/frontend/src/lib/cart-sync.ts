import { api } from "@/lib/api";
import { cartStore, type CartLine } from "@/hooks/use-cart";

export async function pullUserCart(userId: number): Promise<{ lines: CartLine[] }> {
  const res = await api.users.getCart(userId);
  const lines = Array.isArray(res.lines) ? res.lines : [];
  return { lines: lines as unknown as CartLine[] };
}

export async function pushUserCart(
  userId: number,
  payload: { lines: CartLine[] },
): Promise<void> {
  await api.users.saveCart(userId, {
    lines: payload.lines as unknown as Record<string, unknown>[],
  });
}

/**
 * Sau đăng nhập: nếu server có giỏ thì dùng server; nếu server trống mà máy còn
 * giỏ local thì đẩy local lên server.
 */
export async function hydrateCartAfterLogin(userId: number): Promise<void> {
  const local = cartStore.getState();
  const remote = await pullUserCart(userId);
  if (remote.lines.length > 0) {
    cartStore.replaceState({ lines: remote.lines });
  } else if (local.lines.length > 0) {
    await pushUserCart(userId, local);
  }
}
