"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "../button"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { cn } from "../../lib/utils"

export interface SelectPickerOption {
  value: string
  label: string
  render?: () => ReactNode
}

export interface SelectPickerProps {
  value: unknown
  onChange: (value: unknown) => void
  options: SelectPickerOption[]
  placeholder?: string
  id?: string
}

export function SelectPicker({
  value,
  onChange,
  options,
  placeholder = "Tất cả",
  id,
}: SelectPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = typeof value === "string" ? value : ""
  const selectedOption = selected
    ? options.find((o) => o.value === selected)
    : null
  const selectedLabel =
    selectedOption?.label ?? (selected ? selected : placeholder)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 w-full min-w-[160px] justify-between rounded-lg text-sm font-normal"
        >
          <span className="truncate">
            {selectedOption?.render ? selectedOption.render() : selectedLabel}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-sm text-muted-foreground">
            Không có tùy chọn
          </p>
        ) : (
          <div className="max-h-[min(60vh,18rem)] space-y-0.5 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                !selected && "bg-primary/10 font-medium text-primary",
                selected && "cursor-pointer hover:bg-muted"
              )}
            >
              <span className="flex-1 truncate">{placeholder}</span>
              {!selected && <Check className="size-4 shrink-0" />}
            </button>
            {options.map((o) => {
              const isSelected = selected === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    isSelected && "bg-primary/10 font-medium text-primary",
                    !isSelected && "cursor-pointer hover:bg-muted"
                  )}
                >
                  <span className="flex-1 truncate">
                    {o.render ? o.render() : o.label}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0" />}
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
