import type { AuthUser } from "@workspace/api-client";

export const ADMIN_SESSION_KEY = "storesync_admin_session";

export const ADMIN_SESSION_EVENT = "storesync-admin-session";

/** Cùng một chuỗi sessionStorage → cùng reference `AuthUser` (bắt buộc cho useSyncExternalStore). */
let sessionReadCache: { raw: string | null; user: AuthUser | null } | null =
  null;

function parseAdminSessionRaw(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as AuthUser;
    if (
      typeof data?.id !== "number" ||
      !Array.isArray(data.permissions) ||
      typeof data.email !== "string"
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function readAdminSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (sessionReadCache && sessionReadCache.raw === raw) {
    return sessionReadCache.user;
  }
  const user = parseAdminSessionRaw(raw);
  sessionReadCache = { raw, user };
  return user;
}

export function writeAdminSession(user: AuthUser): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminUserId(): number | null {
  return readAdminSession()?.id ?? null;
}

/**
 * Chuỗi gắn vào log dev của api-client: user id, email, role, tóm tắt quyền, X-User-Id.
 * Chỉ gọi từ browser (SSR trả ctx=SSR).
 */
export function getAdminDevAuthLogContext(): string {
  if (typeof window === "undefined") {
    return "ctx=SSR";
  }
  const u = readAdminSession();
  if (!u) {
    return "ctx=guest x-user-id=(none)";
  }
  const roleCodes = u.roles.map((r) => r.code).join(",");
  const permSummary = u.permissions.includes("*")
    ? "perms=* (super)"
    : `perms=n=${u.permissions.length} sample=[${u.permissions.slice(0, 6).join(",")}${u.permissions.length > 6 ? ",…" : ""}]`;
  return `ctx=user id=${u.id} email=${u.email} roles=[${roleCodes}] ${permSummary} x-user-id=${u.id}`;
}
