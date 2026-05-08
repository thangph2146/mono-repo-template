"use client";

import { useSyncExternalStore } from "react";
import { Button } from "./button";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

function getServerSnapshot() {
  return false;
}

function getSnapshot() {
  return true;
}

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <Button
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
    >
      {mounted ? (
        resolved === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" />
      )}
    </Button>
  );
}
