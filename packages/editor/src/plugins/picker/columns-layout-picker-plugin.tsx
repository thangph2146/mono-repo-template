import { Columns3Icon } from "lucide-react"

import { InsertLayoutDialog, LayoutDialogValues } from "../../editor-ui/dialogs"
import { INSERT_LAYOUT_COMMAND } from "../../nodes/layout-container-node"
import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function ColumnsLayoutPickerPlugin() {
  return new ComponentPickerOption("Columns Layout", {
    icon: (
      <IconSize size="sm">
        <Columns3Icon />
      </IconSize>
    ),
    keywords: ["columns", "layout", "grid"],
    onSelect: (_, editor, showModal) =>
      showModal("Insert Columns Layout", (onClose) => (
        <InsertLayoutDialog
          onSubmit={(values: LayoutDialogValues) =>
            editor.dispatchCommand(INSERT_LAYOUT_COMMAND, values)
          }
          onClose={onClose}
        />
      )),
  })
}
