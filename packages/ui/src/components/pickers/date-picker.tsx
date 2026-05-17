"use client";

import { CalendarIcon } from "lucide-react";
import { Button } from "../button";
import { Calendar } from "../calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";

export interface DatePickerProps {
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

export function DatePicker({
  value,
  onChange,
  placeholder = "Tất cả",
  id,
}: DatePickerProps) {
  const dateValue = typeof value === "string" && value ? new Date(value) : undefined;
  const displayLabel =
    dateValue && !Number.isNaN(dateValue.getTime())
      ? dateValue.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : placeholder;

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 text-sm rounded-lg w-full min-w-[160px] justify-between font-normal"
        >
          <span className="truncate">{displayLabel}</span>
          <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            onChange(date ? formatIsoDate(date) : undefined);
          }}
          initialFocus
        />
        {dateValue && (
          <div className="border-t pt-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => onChange(undefined)}
            >
              Xóa ngày
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
