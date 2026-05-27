"use client"

import { useCallback, useState } from "react"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection"
import { $getSelection, $isRangeSelection, BaseSelection } from "lexical"
import { BaselineIcon } from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerPresets,
  ColorPickerTrigger,
} from "../../editor-ui/color-picker"
import { Button } from "../../ui/button"
import { Flex } from "../../ui/flex"
import { IconSize } from "../../ui/typography"

export function FontColorToolbarPlugin() {
  const { activeEditor } = useToolbarContext()

  const [fontColor, setFontColor] = useState("#000")

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000")
      )
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection()
        if (selection !== null) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [activeEditor]
  )

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value })
    },
    [applyStyleText]
  )

  return (
    <ColorPicker
      modal={false}
      defaultFormat="hex"
      defaultValue={fontColor}
      onValueChange={onFontColorSelect}
    >
      <ColorPickerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="editor-toolbar-item--lg"
        >
          <IconSize size="sm">
            <BaselineIcon />
          </IconSize>
        </Button>
      </ColorPickerTrigger>
      <ColorPickerContent>
        <ColorPickerArea />
        <Flex align="center" gap={2}>
          <ColorPickerEyeDropper />
          <Flex direction="column" gap={2} className="editor-flex-1">
            <ColorPickerHueSlider />
            <ColorPickerAlphaSlider />
          </Flex>
        </Flex>
        <Flex align="center" gap={2}>
          <ColorPickerFormatSelect />
          <ColorPickerInput />
        </Flex>
        <ColorPickerPresets />
      </ColorPickerContent>
    </ColorPicker>
  )
}
