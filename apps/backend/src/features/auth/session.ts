import type { AuthUser } from "@workspace/api-client";
import type { AuthLoginPayload } from "./auth-api";

export type StoreSessionPayload = {
  id: string;
  username: string;
  role: "admin" | "store";
  displayName: string;
};

const AUTH_STORAGE_KEY = "storesync_session";

type SessionSource = AuthUser | AuthLoginPayload;

function isStaffRole(role: { name?: string }) {
  const value = (role.name ?? "").trim().toLowerCase();
  return ["super_admin", "admin", "editor", "manager"].includes(value);
}

export function toStoreSession(user: SessionSource): StoreSessionPayload {
  const hasAdminRole = user.roles.some((role) => isStaffRole(role));
  const displayName =
    user.name?.trim() ||
    user.roles[0]?.displayName ||
    user.roles[0]?.name ||
    user.email ||
    "Người dùng HUB";

  return {
    id: String(user.id),
    username: user.email,
    role: hasAdminRole ? "admin" : "store",
    displayName,
  };
}

export function persistSession(session: StoreSessionPayload) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("storesync-session"));
}
