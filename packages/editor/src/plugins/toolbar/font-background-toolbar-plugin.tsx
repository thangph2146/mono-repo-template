"use client"

import { useCallback, useRef, useState } from "react"
import { $isTableCellNode, $isTableSelection, type TableCellNode, TableNode } from "@lexical/table"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection"
import { $findMatchingParent } from "@lexical/utils"
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  BaseSelection,
  NodeKey,
  type LexicalNode,
} from "lexical"
import { PaintBucketIcon } from "lucide-react"

import { $isLayoutItemNode } from "../../nodes/layout-item-node"
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
import { $getCurrentTableNode } from "./table-toolbar-utils"

function $getTableCellsInSelectionForTable(
  selection: BaseSelection,
  tableNode: TableNode
): TableCellNode[] {
  const tableKey = tableNode.getKey()
  const seen = new Set<string>()
  const out: TableCellNode[] = []

  const tryAddFromNode = (node: LexicalNode) => {
    const cell = $findMatchingParent(node, $isTableCellNode)
    if (!cell || !$isTableCellNode(cell)) return
    let walk: LexicalNode | null = cell
    while (walk !== null) {
      if (walk instanceof TableNode && walk.getKey() === tableKey) {
        if (!seen.has(cell.getKey())) {
          seen.add(cell.getKey())
          out.push(cell)
        }
        return
      }
      walk = walk.getParent()
    }
  }

  if ($isTableSelection(selection) || $isRangeSelection(selection)) {
    for (const n of selection.getNodes()) {
      tryAddFromNode(n)
    }
    if ($isRangeSelection(selection)) {
      tryAddFromNode(selection.anchor.getNode())
      tryAddFromNode(selection.focus.getNode())
    }
  }

  return out
}

function toTableOverlayColor(color: string): string {
  const value = color.trim()
  if (!value) return "rgba(0, 0, 0, 0.1)"

  // Nền ô bảng: ~10% màu chọn + 90% trong suốt (trước đây 100% làm màu đặc).
  return `color-mix(in srgb, ${value} 100%, transparent)`
}

export function FontBackgroundToolbarPlugin() {
  const { activeEditor } = useToolbarContext()

  const [bgColor, setBgColor] = useState("#fff")
  const activeLayoutItemKeyRef = useRef<NodeKey | null>(null)

  const extractStyleValue = (style: string, property: string): string | null => {
    const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const match = style.match(new RegExp(`${escapedProperty}\\s*:\\s*([^;]+)`, "i"))
    return match?.[1]?.trim() ?? null
  }

  const setStyleProperty = (
    style: string,
    property: string,
    value: string
  ): string => {
    const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`${escapedProperty}\\s*:\\s*[^;]+`, "i")
    if (regex.test(style)) {
      return style.replace(regex, `${property}: ${value}`)
    }
    return `${style.trim().replace(/;?$/, ";")} ${property}: ${value}`.trim()
  }

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      const layoutItem = $findMatchingParent(selection.anchor.getNode(), (node) =>
        $isLayoutItemNode(node)
      )
      if ($isLayoutItemNode(layoutItem)) {
        activeLayoutItemKeyRef.current = layoutItem.getKey()
        const layoutStyle = layoutItem.getStyle()
        const layoutBg = extractStyleValue(layoutStyle, "background-color")
        if (layoutBg) {
          setBgColor(layoutBg)
          return
        }
      } else {
        activeLayoutItemKeyRef.current = null
      }

      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff"
        )
      )
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      void skipHistoryStack
      activeEditor.update(
        () => {
          const selection = $getSelection()
          if (selection !== null) {
            $patchStyleText(selection, styles)
          }
        },
        { tag: "historic" }
      )
    },
    [activeEditor]
  )

  const onBgColorSelect = useCallback(
    (value: string) => {
      let shouldApplyTextStyle = true
      activeEditor.update(() => {
        const selection = $getSelection()
        const tableNode = $getCurrentTableNode(selection)
        if (selection && tableNode) {
          const overlayColor = toTableOverlayColor(value)
          const cells = $getTableCellsInSelectionForTable(selection, tableNode)
          for (const cell of cells) {
            const withBackground = cell as TableCellNode & {
              setBackgroundColor?: (color: string | null) => void
            }
            if (typeof withBackground.setBackgroundColor === "function") {
              withBackground.setBackgroundColor(overlayColor)
            } else {
              cell.setStyle(
                setStyleProperty(cell.getStyle(), "background-color", overlayColor)
              )
            }
          }
          shouldApplyTextStyle = false
          return
        }

        const selectedLayoutItemKey = activeLayoutItemKeyRef.current
        if (selectedLayoutItemKey) {
          const node = $getNodeByKey(selectedLayoutItemKey)
          if ($isLayoutItemNode(node)) {
            node.setStyle(setStyleProperty(node.getStyle(), "background-color", value))
            shouldApplyTextStyle = false
            return
          }
        }

        if (!$isRangeSelection(selection)) return
        const layoutItem = $findMatchingParent(selection.anchor.getNode(), (node) =>
          $isLayoutItemNode(node)
        )
        if ($isLayoutItemNode(layoutItem)) {
          layoutItem.setStyle(
            setStyleProperty(layoutItem.getStyle(), "background-color", value)
          )
          shouldApplyTextStyle = false
          return
        }
      })
      if (shouldApplyTextStyle) {
        applyStyleText({ "background-color": value }, true)
      }
    },
    [activeEditor, applyStyleText]
  )

  return (
    <ColorPicker
      modal={false}
      defaultFormat="hex"
      defaultValue={bgColor}
      onValueChange={onBgColorSelect}
    >
      <ColorPickerTrigger asChild>
        <Button variant={"outline"} size={"icon"} className="editor-toolbar-item--lg">
          <IconSize size="sm">
            <PaintBucketIcon />
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
