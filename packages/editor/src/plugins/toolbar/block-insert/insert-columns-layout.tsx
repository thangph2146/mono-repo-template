"use client"

import { Columns3Icon } from "lucide-react"

import { useToolbarContext } from "../../../context/toolbar-context"
import { InsertLayoutDialog } from "../../../plugins/layout-plugin"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"
import { IconSize } from "../../../ui/typography"

export function InsertColumnsLayout() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="columns"
      onPointerUp={() =>
        showModal("Insert Columns Layout", (onClose) => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <Flex align="center" gap={2}>
        <IconSize size="sm">
          <Columns3Icon />
        </IconSize>
        <span>Columns Layout</span>
      </Flex>
    </SelectItem>
  )
}
