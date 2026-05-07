"use client";

import { useTextSize } from "./text-size-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SizeOption = { value: "sm" | "base" | "lg"; label: string };

const sizes: SizeOption[] = [
  { value: "sm", label: "S" },
  { value: "base", label: "M" },
  { value: "lg", label: "L" },
];

export function TextSizeToggle() {
  const { size, setSize } = useTextSize();

  return (
    <div className="inline-flex items-center rounded-md border border-border bg-muted p-0.5">
      {sizes.map((s) => (
        <Button
          key={s.value}
          variant="ghost"
          size="sm"
          onClick={() => setSize(s.value)}
          className={cn(
            "h-6 px-2 text-caption font-medium rounded-sm transition-colors",
            size === s.value
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground",
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
