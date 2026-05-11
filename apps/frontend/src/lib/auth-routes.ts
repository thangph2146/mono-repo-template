/**
 * Trang đăng nhập / đăng ký storefront — đã có phiên thì không hiển thị lại form.
 */
export const STORE_AUTH_PATHS = ["/login", "/register"] as const;

const STORE_AUTH_SET = new Set<string>(STORE_AUTH_PATHS);

export function isStoreAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return STORE_AUTH_SET.has(pathname);
}

/** Tránh open redirect: chỉ cho path tương đối nội bộ. */
export function safeRelativeNext(
  raw: string | null | undefined,
  fallback = "/orders",
): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}
