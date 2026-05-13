import { $createQuoteNode } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection, $isRangeSelection } from "lexical"
import { QuoteIcon } from "lucide-react"

import { ComponentPickerOption } from "../../plugins/picker/component-picker-option"
import { IconSize } from "../../ui/typography"

export function QuotePickerPlugin() {
  return new ComponentPickerOption("Quote", {
    icon: <IconSize size="sm"><QuoteIcon /></IconSize>,
    keywords: ["block quote"],
    onSelect: (_, editor) =>
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      }),
  })
}
