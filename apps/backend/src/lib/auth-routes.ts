/**
 * Các đường dẫn “công khai” — không bọc sidebar, không yêu cầu phiên.
 * Đã đăng nhập hợp lệ (staff) sẽ bị chuyển về dashboard.
 */
export const AUTH_LOGIN_PATH = "/login";
export const AUTH_REGISTER_PATH = "/register";

export const AUTH_PATHS = [
  AUTH_LOGIN_PATH,
  AUTH_REGISTER_PATH,
] as const;

export type AuthPath = (typeof AUTH_PATHS)[number];

const AUTH_SET = new Set<string>(AUTH_PATHS);

const BASE_PATH =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_BACKEND_BASE_PATH || "")
    : "";

export function isAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const stripped = BASE_PATH
    ? pathname.replace(new RegExp(`^${BASE_PATH}`), "") || "/"
    : pathname;
  return AUTH_SET.has(stripped);
}

function inferExternalAdminBase(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/admin" || normalized.startsWith("/admin/")) {
    return "/admin";
  }
  return "";
}

export function getAdminAppHomeExternalPath(
  pathname: string | null | undefined = typeof window !== "undefined"
    ? window.location.pathname
    : undefined,
): string {
  const base = inferExternalAdminBase(pathname);
  return base || "/";
}

export function getAdminLoginExternalPath(
  pathname: string | null | undefined = typeof window !== "undefined"
    ? window.location.pathname
    : undefined,
): string {
  const base = inferExternalAdminBase(pathname);
  return `${base}${AUTH_LOGIN_PATH}`;
}
