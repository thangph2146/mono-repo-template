"use client"

import { PlusIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "../../ui/select"
import { IconSize } from "../../ui/typography"

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  return (
    <Select modal={false} value={""}>
      <SelectTrigger className="editor-toolbar-item editor-toolbar-item--w-auto editor-toolbar-item--gap-sm">
        <IconSize size="sm">
          <PlusIcon />
        </IconSize>
        <span>Insert</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}
