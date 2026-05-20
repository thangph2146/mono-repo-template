"use client"

import { Check, ChevronDown, Folder } from "lucide-react"
import { Badge } from "../badge"
import { Checkbox } from "../checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible"
import { cn } from "../../lib/utils"
import type { TreeOption } from "../pickers"

export interface TreeMultiSelectInlineProps {
  value: unknown
  onChange: (value: unknown) => void
  options: TreeOption[]
  className?: string
}

function TreeMultiSelectInlineItem({
  label,
  value,
  depth,
  isParent,
  selected,
  onSelect,
  subOptions,
}: {
  label: string
  value: string
  depth: number
  isParent: boolean
  selected: string[]
  onSelect: (value: string) => void
  subOptions?: TreeOption[]
}) {
  const isSelected = selected.includes(value)
  const hasChildren = (subOptions?.length ?? 0) > 0

  return (
    <Collapsible className="group space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 bg-background px-2 py-1.5 text-sm",
          isSelected && "border-primary/50 bg-primary/5"
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <CollapsibleTrigger
            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Ẩn/hiện danh mục con của ${label}`}
          >
            <ChevronDown className="size-4 transition-transform duration-200 group-data-closed:-rotate-90" />
          </CollapsibleTrigger>
        ) : (
          <div className="size-5 shrink-0" />
        )}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(value)}
          aria-label={`Chọn danh mục ${label}`}
        />
        {isParent && <Folder className="size-4 shrink-0 text-amber-500" />}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {hasChildren ? (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {subOptions?.length} mục con
          </Badge>
        ) : null}
        {isSelected && <Check className="size-4 shrink-0 text-primary" />}
      </div>
      {hasChildren && (
        <CollapsibleContent>
          {subOptions?.map((child) => (
            <TreeMultiSelectInlineItem
              key={child.value}
              label={child.label}
              value={child.value}
              depth={depth + 1}
              isParent={(child.children?.length ?? 0) > 0}
              selected={selected}
              onSelect={onSelect}
              subOptions={child.children}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function TreeMultiSelectInline({
  value,
  onChange,
  options,
  className,
}: TreeMultiSelectInlineProps) {
  const selected = Array.isArray(value) ? (value as string[]) : []

  const handleSelect = (val: string) => {
    if (!val) {
      onChange(undefined)
      return
    }
    const nextSelected = selected.includes(val)
      ? selected.filter((s) => s !== val)
      : [...selected, val]
    onChange(nextSelected.length ? nextSelected : undefined)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {options.length === 0 ? (
        <p className="px-2 py-1 text-sm text-muted-foreground">
          Không có tùy chọn
        </p>
      ) : (
        <div className="max-h-80 space-y-0.5 overflow-y-auto">
          {options.map((node) => (
            <TreeMultiSelectInlineItem
              key={node.value}
              label={node.label}
              value={node.value}
              depth={0}
              isParent={(node.children?.length ?? 0) > 0}
              selected={selected}
              onSelect={handleSelect}
              subOptions={node.children}
            />
          ))}
        </div>
      )}
    </div>
  )
}
