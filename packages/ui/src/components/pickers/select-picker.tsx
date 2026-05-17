"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "../button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";
import { cn } from "../../lib/utils";

export interface SelectPickerProps {
  value: unknown;
  onChange: (value: unknown) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  id?: string;
}

export function SelectPicker({
  value,
  onChange,
  options,
  placeholder = "Tất cả",
  id,
}: SelectPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = typeof value === "string" ? value : "";
  const selectedLabel = selected
    ? options.find((o) => o.value === selected)?.label ?? selected
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 text-sm rounded-lg w-full min-w-[160px] justify-between font-normal"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">Không có tùy chọn</p>
        ) : (
          <div className="space-y-0.5 max-h-[min(60vh,18rem)] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                !selected && "bg-primary/10 text-primary font-medium",
                selected && "hover:bg-muted cursor-pointer",
              )}
            >
              <span className="flex-1 truncate">{placeholder}</span>
              {!selected && <Check className="size-4 shrink-0" />}
            </button>
            {options.map((o) => {
              const isSelected = selected === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
                    isSelected && "bg-primary/10 text-primary font-medium",
                    !isSelected && "hover:bg-muted cursor-pointer",
                  )}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {isSelected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
