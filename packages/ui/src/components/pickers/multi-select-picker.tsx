"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "../button"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { cn } from "../../lib/utils"

export interface MultiSelectPickerProps {
  value: unknown
  onChange: (value: unknown) => void
  options: { value: string; label: string }[]
  placeholder?: string
  id?: string
}

export function MultiSelectPicker({
  value,
  onChange,
  options,
  placeholder = "Tất cả",
  id,
}: MultiSelectPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = Array.isArray(value) ? (value as string[]) : []
  const [draft, setDraft] = useState<string[]>(selected)

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ??
          `${selected.length} đã chọn`)
        : `${selected.length} đã chọn`

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      setDraft(selected)
    }
  }

  const handleToggle = (val: string) => {
    setDraft((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    )
  }

  const handleApply = () => {
    onChange(draft.length ? draft : undefined)
    setOpen(false)
  }

  const handleClear = () => {
    setDraft([])
    onChange(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 w-full min-w-[160px] justify-between rounded-lg text-sm font-normal"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-sm text-muted-foreground">
            Không có tùy chọn
          </p>
        ) : (
          <>
            <div className="max-h-[min(60vh,18rem)] space-y-0.5 overflow-y-auto">
              {options.map((o) => {
                const isSelected = draft.includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleToggle(o.value)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      isSelected && "bg-primary/10 font-medium text-primary",
                      !isSelected && "cursor-pointer hover:bg-muted"
                    )}
                  >
                    <span className="flex-1 truncate">{o.label}</span>
                    {isSelected && <Check className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex gap-2 border-t pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={handleClear}
              >
                Xóa
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={handleApply}
              >
                Áp dụng
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
