"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";

export interface DateRangePickerProps {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
  id?: string;
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Tất cả",
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<{ from?: Date; to?: Date }>(() => {
    if (typeof value === "string" && value) {
      const [fromStr, toStr] = value.split(",");
      const from = fromStr ? new Date(fromStr) : undefined;
      const to = toStr ? new Date(toStr) : undefined;
      return {
        from: from && !Number.isNaN(from.getTime()) ? from : undefined,
        to: to && !Number.isNaN(to.getTime()) ? to : undefined,
      };
    }
    return {};
  });

  const fmt = (d?: Date) =>
    d
      ? d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "";
  const displayLabel =
    draftRange.from || draftRange.to
      ? `${fmt(draftRange.from)}${draftRange.to ? ` - ${fmt(draftRange.to)}` : ""}`
      : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 text-sm rounded-lg w-full min-w-[200px] justify-between font-normal"
        >
          <span className="truncate">{displayLabel}</span>
          <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          captionLayout="dropdown"
          selected={
            draftRange.from ? { from: draftRange.from, to: draftRange.to } : undefined
          }
          onSelect={(range) => {
            setDraftRange({ from: range?.from, to: range?.to });
          }}
          initialFocus
        />
        <div className="flex gap-2 border-t pt-2 mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              setDraftRange({});
              onChange(undefined);
            }}
          >
            Xóa
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              if (draftRange.from) {
                const f = formatIsoDate(draftRange.from);
                const t = draftRange.to ? formatIsoDate(draftRange.to) : "";
                onChange(`${f},${t}`);
              } else {
                onChange(undefined);
              }
              setOpen(false);
            }}
          >
            Áp dụng
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
