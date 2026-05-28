import type { AuthUser } from "@workspace/api-client";

export const ADMIN_SESSION_KEY = "storesync_admin_session";

export const ADMIN_SESSION_EVENT = "storesync-admin-session";

/** Cùng một chuỗi sessionStorage → cùng reference `AuthUser` (bắt buộc cho useSyncExternalStore). */
let sessionReadCache: { raw: string | null; user: AuthUser | null } | null =
  null;

function normalizePermissionValues(value: unknown): string[] {
  const visit = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap((item) => visit(item));
    }
    if (typeof input !== "string") {
      return [];
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return visit(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  };

  return [...new Set(visit(value))];
}

function parseAdminSessionRaw(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as AuthUser;
    const dataRecord = data as unknown as {
      id?: string | number;
      email?: string;
      name?: string | null;
      permissions?: unknown[];
      roles?: unknown[];
    };
    if (
      !(
        (typeof dataRecord.id === "number" && Number.isFinite(dataRecord.id)) ||
        (typeof dataRecord.id === "string" && dataRecord.id.trim() !== "")
      ) ||
      !Array.isArray(dataRecord.permissions) ||
      typeof dataRecord.email !== "string" ||
      !(
        typeof dataRecord.name === "string" ||
        dataRecord.name === null ||
        dataRecord.name === undefined
      ) ||
      !Array.isArray(dataRecord.roles)
    ) {
      return null;
    }
    return {
      ...data,
      permissions: normalizePermissionValues(dataRecord.permissions),
    };
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
  sessionReadCache = {
    raw: sessionStorage.getItem(ADMIN_SESSION_KEY),
    user,
  };
}

/** Sau khi cập nhật hồ sơ qua API — giữ nguyên permissions từ phiên đăng nhập. */
export function patchAdminSessionProfile(
  fields: Partial<
    Pick<AuthUser, "name" | "phone" | "address" | "image" | "updatedAt">
  >,
): void {
  const prev = readAdminSession();
  if (!prev) return;
  writeAdminSession({ ...prev, ...fields });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionReadCache = null;
}

export function getAdminUserId(): string | number | null {
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
  const roleCodes = u.roles.map((r) => r.name).join(",");
  const permSummary = u.permissions.includes("*")
    ? "perms=* (super)"
    : `perms=n=${u.permissions.length} sample=[${u.permissions.slice(0, 6).join(",")}${u.permissions.length > 6 ? ",…" : ""}]`;
  return `ctx=user id=${u.id} email=${u.email} roles=[${roleCodes}] ${permSummary} x-user-id=${u.id}`;
}
