import { FORMAT_ELEMENT_COMMAND } from "lexical"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from "lucide-react"

import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function AlignmentPickerPlugin({
  alignment,
}: {
  alignment: "left" | "center" | "right" | "justify"
}) {
  return new ComponentPickerOption(`Align ${alignment}`, {
    icon: <AlignIcons alignment={alignment} />,
    keywords: ["align", "justify", alignment],
    onSelect: (_, editor) =>
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
  })
}

function AlignIcons({
  alignment,
}: {
  alignment: "left" | "center" | "right" | "justify"
}) {
  switch (alignment) {
    case "left":
      return (
        <IconSize size="sm">
          <AlignLeftIcon />
        </IconSize>
      )
    case "center":
      return (
        <IconSize size="sm">
          <AlignCenterIcon />
        </IconSize>
      )
    case "right":
      return (
        <IconSize size="sm">
          <AlignRightIcon />
        </IconSize>
      )
    case "justify":
      return (
        <IconSize size="sm">
          <AlignJustifyIcon />
        </IconSize>
      )
  }
}
