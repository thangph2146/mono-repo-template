"use client"

import type { JSX } from "react"
import { useCallback, useState } from "react"
import { $isListNode } from "@lexical/list"
import { $findMatchingParent } from "@lexical/utils"
import {
  $getNodeByKey,
  $isRangeSelection,
  type BaseSelection,
  type NodeKey,
} from "lexical"
import { Palette } from "lucide-react"

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
import { $isListWithColorNode } from "../../nodes/list-with-color-node"
import { createListWithColorNodeFromRegistry } from "../../editor-x/nodes"
import { Button } from "../../ui/button"
import { Flex } from "../../ui/flex"
import { IconSize } from "../../ui/typography"

export function NodeOptionsToolbarPlugin(): JSX.Element | null {
  const { activeEditor } = useToolbarContext()
  const [inList, setInList] = useState(false)
  const [listKey, setListKey] = useState<NodeKey | null>(null)
  const [listMarkerColor, setListMarkerColor] = useState("#000000")

  const readSelectionFlags = useCallback((selection: BaseSelection) => {
    if (!$isRangeSelection(selection)) {
      setInList(false)
      setListKey(null)
      return
    }
    const anchor = selection.anchor.getNode()

    const listNode = $findMatchingParent(anchor, $isListNode)
    const inL = $isListNode(listNode)
    setInList(inL)
    setListKey(inL ? listNode.getKey() : null)

    if (inL) {
      if ($isListWithColorNode(listNode)) {
        setListMarkerColor(listNode.getListColor() ?? "#000000")
      } else {
        setListMarkerColor("#000000")
      }
    } else {
      setListMarkerColor("#000000")
    }
  }, [])

  useUpdateToolbarHandler(readSelectionFlags)

  const applyListColor = useCallback(
    (color: string) => {
      if (!listKey) return
      setListMarkerColor(color)

      activeEditor.update(() => {
        const node = $getNodeByKey(listKey)
        if ($isListWithColorNode(node)) {
          node.setListColor(color)
          return
        }
        if ($isListNode(node)) {
          const listType = node.getListType()
          const start = node.getStart()
          const newList = createListWithColorNodeFromRegistry(
            activeEditor,
            listType,
            start,
            node
          )
          newList.setListColor(color)
          const children = node.getChildren()
          for (const c of children) newList.append(c)
          node.replace(newList)
        }
      })
    },
    [activeEditor, listKey]
  )

  if (!inList) return null

  return (
    <ColorPicker
      modal
      defaultFormat="hex"
      value={listMarkerColor}
      onValueChange={applyListColor}
      onOpenChange={(open) => {
        if (!open) {
          activeEditor.focus()
        }
      }}
    >
      <ColorPickerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="editor-toolbar-item--lg"
          title="Đổi màu marker list"
          aria-label="Đổi màu marker list"
        >
          <IconSize size="sm">
            <Palette />
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
