import { $setBlocksType } from "@lexical/selection"
import { $createParagraphNode, $getSelection, $isRangeSelection } from "lexical"
import { TextIcon } from "lucide-react"

import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function ParagraphPickerPlugin() {
  return new ComponentPickerOption("Paragraph", {
    icon: <IconSize size="sm"><TextIcon /></IconSize>,
    keywords: ["normal", "paragraph", "p", "text"],
    onSelect: (_, editor) =>
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      }),
  })
}
