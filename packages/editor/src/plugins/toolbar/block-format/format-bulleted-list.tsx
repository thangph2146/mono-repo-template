import {
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import { $getSelection, $isRangeSelection } from "lexical"

import { useToolbarContext } from "../../../context/toolbar-context"
import { $tryPartialListTypeConversion } from "../../../lib/partial-list-type-conversion"
import { $applyBulletListMarkerFromAnchor } from "../../../lib/list-marker-from-anchor"
import { blockTypeToBlockName } from "../../../plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"

const BLOCK_FORMAT_VALUE = "bullet"

export function FormatBulletedList() {
  const { activeEditor, blockType } = useToolbarContext()

  const formatParagraph = () => {
    activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
  }

  const formatBulletedList = () => {
    const isAnyBulletList =
      blockType === "bullet" ||
      (typeof blockType === "string" && blockType.startsWith("bullet-"))

    if (blockType === "bullet") {
      formatParagraph()
      return
    }

    if (isAnyBulletList) {
      activeEditor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $applyBulletListMarkerFromAnchor(
            activeEditor,
            selection.anchor.getNode(),
            undefined
          )
          $applyBulletListMarkerFromAnchor(
            activeEditor,
            selection.focus.getNode(),
            undefined
          )
        }
      })
      return
    }

    if (blockType !== "bullet") {
      activeEditor.update(() => {
        const selection = $getSelection()
        if (
          $isRangeSelection(selection) &&
          $tryPartialListTypeConversion(activeEditor, selection, "bullet")
        ) {
          const nextSelection = $getSelection()
          if ($isRangeSelection(nextSelection)) {
            $applyBulletListMarkerFromAnchor(
              activeEditor,
              nextSelection.anchor.getNode(),
              undefined
            )
            $applyBulletListMarkerFromAnchor(
              activeEditor,
              nextSelection.focus.getNode(),
              undefined
            )
          }
          return
        }
        activeEditor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        const nextSelection = $getSelection()
        if ($isRangeSelection(nextSelection)) {
          $applyBulletListMarkerFromAnchor(
            activeEditor,
            nextSelection.anchor.getNode(),
            undefined
          )
          $applyBulletListMarkerFromAnchor(
            activeEditor,
            nextSelection.focus.getNode(),
            undefined
          )
        }
      })
    }
  }

  return (
    <SelectItem value={BLOCK_FORMAT_VALUE} onPointerDown={formatBulletedList}>
      <Flex align="center" gap={2}>
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.label}
      </Flex>
    </SelectItem>
  )
}
