/**
 * Các đường dẫn “công khai” — không bọc sidebar, không yêu cầu phiên.
 * Đã đăng nhập hợp lệ (staff) sẽ bị chuyển về dashboard.
 */
export const AUTH_PATHS = ["/login", "/register"] as const;

export type AuthPath = (typeof AUTH_PATHS)[number];

const AUTH_SET = new Set<string>(AUTH_PATHS);

export function isAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_SET.has(pathname);
}
