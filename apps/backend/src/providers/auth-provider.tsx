"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@workspace/api-client";
import { canAccessStaffAdmin } from "@workspace/api-client";
import {
  loginWithDevelopmentUser,
  loginWithEmail,
  toAdminSessionUser,
} from "@/features/auth/auth-api";
import {
  ADMIN_SESSION_EVENT,
  ADMIN_SESSION_KEY,
  clearAdminSession,
  readAdminSession,
  writeAdminSession,
} from "@/lib/auth-session";
import { AUTH_LOGIN_PATH } from "@/lib/auth-routes";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === ADMIN_SESSION_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_SESSION_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_SESSION_EVENT, onCustom);
  };
}

function getSessionSnapshot(): AuthUser | null {
  return readAdminSession();
}

function getServerSnapshot(): null {
  return null;
}

export type StaffLoginResult =
  | "success"
  | "invalid_credentials"
  | "staff_only";

type AuthContextValue = {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<StaffLoginResult>;
  loginDevelopment: (userId: string) => Promise<StaffLoginResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribe,
    getSessionSnapshot,
    getServerSnapshot,
  );

  const login = useCallback(async (email: string, password: string) => {
    let u: AuthUser;
    try {
      const payload = await loginWithEmail({
        email: email.trim(),
        password,
      });
      u = toAdminSessionUser(payload);
    } catch {
      return "invalid_credentials";
    }
    if (!canAccessStaffAdmin(u)) return "staff_only";
    writeAdminSession(u);
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    return "success";
  }, []);

  const loginDevelopment = useCallback(async (userId: string) => {
    let u: AuthUser;
    try {
      const payload = await loginWithDevelopmentUser({
        userId: userId.trim(),
      });
      u = toAdminSessionUser(payload);
    } catch {
      return "invalid_credentials";
    }
    if (!canAccessStaffAdmin(u)) return "staff_only";
    writeAdminSession(u);
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    return "success";
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    router.replace(AUTH_LOGIN_PATH);
  }, [router]);

  const value = useMemo(
    () => ({ user, login, loginDevelopment, logout }),
    [user, login, loginDevelopment, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải dùng bên trong AuthProvider");
  }
  return ctx;
}

const noopSubscribe = () => () => {};

/** Tránh flash / hydration: server `false`, client `true` (không dùng setState trong effect). */
export function useClientReady(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
