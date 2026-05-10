"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@workspace/api-client";
import { canAccessStaffAdmin } from "@workspace/api-client";
import { api } from "@/lib/api";
import {
  ADMIN_SESSION_EVENT,
  ADMIN_SESSION_KEY,
  clearAdminSession,
  readAdminSession,
  writeAdminSession,
} from "@/lib/auth-session";

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
    const u = await api.users.login({ email: email.trim(), password });
    if (!u) return "invalid_credentials";
    if (!canAccessStaffAdmin(u)) return "staff_only";
    writeAdminSession(u);
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    return "success";
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, login, logout }),
    [user, login, logout],
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

/** Tránh flash / hydration: chỉ sau mount mới coi session là đáng tin. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
