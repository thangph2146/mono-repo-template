"use client";

import { Button } from "./button";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { useHydrated } from "../hooks/use-hydrated";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const hydrated = useHydrated();

  return (
    <Button
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
    >
      {hydrated ? (
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
