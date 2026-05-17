"use client";

import { useState } from "react";
import { Check, ChevronDown, FileText, Folder } from "lucide-react";
import { Button } from "../button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";
import { cn } from "../../lib/utils";

export interface TreeOption {
  value: string;
  label: string;
  children?: TreeOption[];
}

export interface TreeMultiSelectPickerProps {
  value: unknown;
  onChange: (value: unknown) => void;
  options: TreeOption[];
  placeholder?: string;
  id?: string;
}

function flattenTreeOptions(nodes: TreeOption[]): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  for (const node of nodes) {
    result.push({ value: node.value, label: node.label });
    if (node.children?.length) {
      result.push(...flattenTreeOptions(node.children));
    }
  }
  return result;
}

function TreeMultiSelectItem({
  label,
  value,
  depth,
  isParent,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  depth: number;
  isParent: boolean;
  selected: string[];
  onSelect: (value: string) => void;
}) {
  const isSelected = selected.includes(value);
  return (
    <button
      type="button"
      disabled={isParent}
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
        isSelected && "bg-primary/10 text-primary font-medium",
        !isSelected && !isParent && "hover:bg-muted cursor-pointer",
        isParent && "text-muted-foreground cursor-default opacity-60",
      )}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      {isParent ? (
        <Folder className="size-4 shrink-0 text-amber-500" />
      ) : (
        <FileText className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {isSelected && <Check className="size-4 shrink-0" />}
    </button>
  );
}

function TreeMultiSelectNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeOption;
  depth: number;
  selected: string[];
  onSelect: (value: string) => void;
}) {
  const isParent = (node.children?.length ?? 0) > 0;
  return (
    <div>
      <TreeMultiSelectItem
        label={node.label}
        value={node.value}
        depth={depth}
        isParent={isParent}
        selected={selected}
        onSelect={onSelect}
      />
      {node.children?.map((child) => (
        <TreeMultiSelectNode
          key={child.value}
          node={child}
          depth={depth + 1}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function TreeMultiSelectPicker({
  value,
  onChange,
  options,
  placeholder = "Tất cả",
  id,
}: TreeMultiSelectPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const [draft, setDraft] = useState<string[]>(selected);

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? flattenTreeOptions(options).find((o) => o.value === selected[0])?.label ?? `${selected.length} đã chọn`
        : `${selected.length} đã chọn`;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraft(selected);
    }
  };

  const handleSelect = (v: string) => {
    if (!v) {
      setDraft([]);
      return;
    }
    setDraft((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  };

  const handleApply = () => {
    onChange(draft.length ? draft : undefined);
    setOpen(false);
  };

  const handleClear = () => {
    setDraft([]);
    onChange(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>
        <Button
          type="button"
          variant="outline"
          id={id}
          className="h-9 text-sm rounded-lg w-full min-w-[160px] justify-between font-normal"
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">Không có tùy chọn</p>
        ) : (
          <>
            <div className="space-y-0.5 max-h-[min(60vh,18rem)] overflow-y-auto">
              <TreeMultiSelectItem
                label={placeholder}
                value=""
                depth={0}
                isParent={false}
                selected={draft}
                onSelect={handleSelect}
              />
              {options.map((node) => (
                <TreeMultiSelectNode
                  key={node.value}
                  node={node}
                  depth={0}
                  selected={draft}
                  onSelect={handleSelect}
                />
              ))}
            </div>
            <div className="flex gap-2 border-t pt-2 mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleClear}
              >
                Xóa
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleApply}
              >
                Áp dụng
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
