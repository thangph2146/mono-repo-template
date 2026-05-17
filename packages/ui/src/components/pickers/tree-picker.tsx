"use client";

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

export interface TreePickerProps {
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

function TreeSelectItem({
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
  selected: string;
  onSelect: (value: string) => void;
}) {
  const isSelected = selected === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left",
        isSelected && "bg-primary/10 text-primary font-medium",
        !isSelected && "hover:bg-muted cursor-pointer",
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

function TreeSelectNode({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeOption;
  depth: number;
  selected: string;
  onSelect: (value: string) => void;
}) {
  const isParent = (node.children?.length ?? 0) > 0;
  return (
    <div>
      <TreeSelectItem
        label={node.label}
        value={node.value}
        depth={depth}
        isParent={isParent}
        selected={selected}
        onSelect={onSelect}
      />
      {node.children?.map((child) => (
        <TreeSelectNode
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

export function TreePicker({
  value,
  onChange,
  options,
  placeholder = "Tất cả",
  id,
}: TreePickerProps) {
  const selected = typeof value === "string" ? value : "";
  const selectedLabel = selected
    ? (flattenTreeOptions(options).find((o) => o.value === selected)?.label ?? selected)
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
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-1">Không có tùy chọn</p>
        ) : (
          <div className="space-y-0.5 max-h-[min(60vh,18rem)] overflow-y-auto">
            <TreeSelectItem
              label={placeholder}
              value=""
              depth={0}
              isParent={false}
              selected={selected}
              onSelect={(v) => onChange(v || undefined)}
            />
            {options.map((node) => (
              <TreeSelectNode
                key={node.value}
                node={node}
                depth={0}
                selected={selected}
                onSelect={(v) => onChange(v || undefined)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
