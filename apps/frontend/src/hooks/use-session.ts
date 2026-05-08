"use client";

import { useMemo, useSyncExternalStore } from "react";

export type MockSession = {
  id: string;
  username: string;
  role: "admin" | "store";
  displayName: string;
};

const STORAGE_KEY = "storesync_session";

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useSession(): MockSession | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MockSession;
    } catch {
      return null;
    }
  }, [raw]);
}
