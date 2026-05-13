import { INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list"
import { ListIcon } from "lucide-react"

import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function BulletedListPickerPlugin() {
  return new ComponentPickerOption("Bulleted List", {
    icon: <IconSize size="sm"><ListIcon /></IconSize>,
    keywords: ["bulleted list", "unordered list", "ul", "- list", "+ list"],
    onSelect: (_, editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  })
}
