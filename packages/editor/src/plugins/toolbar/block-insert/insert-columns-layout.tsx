"use client"

import { Columns3Icon } from "lucide-react"

import { useToolbarContext } from "../../../context/toolbar-context"
import { InsertLayoutDialog, LayoutDialogValues } from "../../../editor-ui/dialogs"
import { INSERT_LAYOUT_COMMAND } from "../../../nodes/layout-container-node"
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
          <InsertLayoutDialog
            onSubmit={(values: LayoutDialogValues) =>
              activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, values)
            }
            onClose={onClose}
          />
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
