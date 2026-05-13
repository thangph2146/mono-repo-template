"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useHydrated } from "../hooks/use-hydrated";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "storesync-theme";
const themeStore = {
  current: "system" as Theme,
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  },
  getSnapshot(): Theme {
    return this.current;
  },
  setTheme(nextTheme: Theme) {
    this.current = nextTheme;
    this.listeners.forEach((listener) => listener());
  },
};

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useSystemTheme(): "light" | "dark" {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    getSystemTheme,
    () => "light",
  ) as "light" | "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const theme = useSyncExternalStore<Theme>(
    (fn) => themeStore.subscribe(fn),
    () => themeStore.getSnapshot(),
    () => "system",
  );

  const systemTheme = useSystemTheme();
  const resolved = useMemo<"light" | "dark">(
    () => (theme === "system" ? systemTheme : theme),
    [theme, systemTheme],
  );

  useEffect(() => {
    if (!hydrated) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        themeStore.setTheme(stored);
      }
    } catch {
      // ignore
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [hydrated, theme, resolved]);

  const setTheme = useCallback((nextTheme: Theme) => {
    themeStore.setTheme(nextTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
