"use client";

import { useTextSize } from "./text-size-provider";
import { Button } from "./button";
import { cn } from "../lib/utils";

type SizeOption = { value: "sm" | "base" | "lg"; label: string };

const sizes: SizeOption[] = [
  { value: "sm", label: "S" },
  { value: "base", label: "M" },
  { value: "lg", label: "L" },
];

export function TextSizeToggle() {
  const { size, setSize } = useTextSize();

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-muted/50 p-1">
      {sizes.map((s) => (
        <Button
          key={s.value}
          variant="ghost"
          size="sm"
          onClick={() => setSize(s.value)}
          className={cn(
            "h-7 px-3 text-xs font-bold rounded-md transition-all duration-200",
            size === s.value
              ? "bg-background text-primary shadow-md hover:bg-background scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          )}
          aria-label={`Set text size ${s.label}`}
          aria-pressed={size === s.value}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
