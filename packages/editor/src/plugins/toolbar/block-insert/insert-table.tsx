"use client"

import { TableIcon } from "lucide-react"

import { useToolbarContext } from "../../../context/toolbar-context"
import { InsertTableDialog } from "../../../editor-ui/dialogs"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"
import { IconSize } from "../../../ui/typography"

export function InsertTable() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="table"
      onPointerUp={() =>
        showModal("Insert Table", (onClose) => (
          <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <Flex align="center" gap={2}>
        <IconSize size="sm">
          <TableIcon />
        </IconSize>
        <span>Table</span>
      </Flex>
    </SelectItem>
  )
}
