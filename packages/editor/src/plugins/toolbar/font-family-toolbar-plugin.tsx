"use client"

import { useCallback, useState } from "react"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection"
import { $getSelection, $isRangeSelection, BaseSelection } from "lexical"
import { TypeIcon } from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../../ui/select"
import { IconSize } from "../../ui/typography"

const FONT_FAMILY_OPTIONS = [
  "Arial",
  "Verdana",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Trebuchet MS",
]

export function FontFamilyToolbarPlugin() {
  const style = "font-family"
  const [fontFamily, setFontFamily] = useState("Arial")

  const { activeEditor } = useToolbarContext()

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      )
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const handleClick = useCallback(
    (option: string) => {
      activeEditor.update(() => {
        const selection = $getSelection()
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          })
        }
      })
    },
    [activeEditor, style]
  )

  const buttonAriaLabel = "Formatting options for font family"

  return (
    <Select
      modal={false}
      value={fontFamily}
      onValueChange={(value) => {
        setFontFamily(value)
        handleClick(value)
      }}
      aria-label={buttonAriaLabel}
    >
      <SelectTrigger className="editor-toolbar-select-trigger editor-toolbar-select-trigger--w-auto editor-toolbar-item--gap-sm">
        <IconSize size="sm">
          <TypeIcon />
        </IconSize>
        <span style={{ fontFamily }}>{fontFamily}</span>
      </SelectTrigger>
      <SelectContent>
        {FONT_FAMILY_OPTIONS.map((option) => (
          <SelectItem
            key={option}
            value={option}
            style={{ fontFamily: option }}
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
