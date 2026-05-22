import { ImageIcon } from "lucide-react"

import { InsertImageDialog } from "../../editor-ui/dialogs"
import { INSERT_IMAGE_COMMAND } from "../../nodes/image-node"
import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function ImagePickerPlugin() {
  return new ComponentPickerOption("Image", {
    icon: (
      <IconSize size="sm">
        <ImageIcon />
      </IconSize>
    ),
    keywords: ["image", "photo", "picture", "file"],
    onSelect: (_, editor, showModal) =>
      showModal("Insert Image", (onClose) => (
        <InsertImageDialog
          onSubmit={(payload) =>
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
          }
          onClose={onClose}
        />
      )),
  })
}
