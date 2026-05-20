"use client"

import { useRef, useState } from "react"
import { $isLinkNode } from "@lexical/link"
import { $isTableCellNode, type TableCellNode, TableNode } from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  BaseSelection,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  LexicalNode,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
} from "lexical"
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
} from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { $isLayoutItemNode } from "../../nodes/layout-item-node"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { getSelectedNode } from "../../utils/get-selected-node"
import { $getCurrentTableNode } from "./table-toolbar-utils"
import { Button } from "../../ui/button"
import { Separator } from "../../ui/separator"
import { IconSize } from "../../ui/typography"

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, "start" | "end" | "">]: {
    icon: React.ReactNode
    iconRTL: string
    name: string
  }
} = {
  left: {
    icon: (
      <IconSize size="sm">
        <AlignLeftIcon />
      </IconSize>
    ),
    iconRTL: "left-align",
    name: "Left Align",
  },
  center: {
    icon: (
      <IconSize size="sm">
        <AlignCenterIcon />
      </IconSize>
    ),
    iconRTL: "center-align",
    name: "Center Align",
  },
  right: {
    icon: (
      <IconSize size="sm">
        <AlignRightIcon />
      </IconSize>
    ),
    iconRTL: "right-align",
    name: "Right Align",
  },
  justify: {
    icon: (
      <IconSize size="sm">
        <AlignJustifyIcon />
      </IconSize>
    ),
    iconRTL: "justify-align",
    name: "Justify Align",
  },
} as const

export function ElementFormatToolbarPlugin({
  separator = true,
}: {
  separator?: boolean
}) {
  const { activeEditor } = useToolbarContext()
  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left")
  const activeLayoutItemKeyRef = useRef<NodeKey | null>(null)

  const extractPadding = (style: string): number | null => {
    const match = style.match(/padding\s*:\s*(\d+)px/i)
    if (!match?.[1]) return null
    const value = Number.parseInt(match[1], 10)
    return Number.isFinite(value) ? value : null
  }

  const setPadding = (style: string, nextPadding: number): string => {
    if (/padding\s*:\s*\d+px/i.test(style)) {
      return style.replace(/padding\s*:\s*\d+px/i, `padding: ${nextPadding}px`)
    }
    return `${style.trim().replace(/;?$/, ";")} padding: ${nextPadding}px`.trim()
  }

  const stripTextAlignFromInlineStyle = (style: string): string => {
    if (!style.trim()) return ""
    let s = style.replace(/text-align\s*:\s*[^;]+;?/gi, "")
    s = s
      .replace(/\s*;\s*;/g, ";")
      .replace(/^;+|;+$/g, "")
      .trim()
    return s
  }

  const getTableCellsInSelectionForTable = (
    selection: BaseSelection,
    tableNode: TableNode
  ): TableCellNode[] => {
    const tableKey = tableNode.getKey()
    const seen = new Set<string>()
    const out: TableCellNode[] = []

    const tryAddFromNode = (node: LexicalNode) => {
      const cell = $isTableCellNode(node)
        ? node
        : $findMatchingParent(node, $isTableCellNode)
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

    for (const n of selection.getNodes()) {
      tryAddFromNode(n)
      if (n instanceof TableNode && n.getKey() === tableKey) {
        const stack: LexicalNode[] = [...n.getChildren()]
        while (stack.length > 0) {
          const current = stack.pop()
          if (!current) continue
          tryAddFromNode(current)
          if ($isElementNode(current)) {
            stack.push(...current.getChildren())
          }
        }
      }
    }
    if ($isRangeSelection(selection)) {
      tryAddFromNode(selection.anchor.getNode())
      tryAddFromNode(selection.focus.getNode())
    }
    return out
  }

  const applyAlignmentToTableCell = (
    cell: TableCellNode,
    formatType: ElementFormatType
  ) => {
    cell.setFormat(formatType)
    const visit = (node: LexicalNode) => {
      if (node instanceof TableNode) return
      if ($isElementNode(node) && !node.isInline()) {
        node.setFormat(formatType)
        const style = node.getStyle()
        if (style && /text-align\s*:/i.test(style)) {
          node.setStyle(stripTextAlignFromInlineStyle(style))
        }
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) visit(child)
      }
    }
    for (const child of cell.getChildren()) visit(child)
  }

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      const layoutItem = $findMatchingParent(
        selection.anchor.getNode(),
        (node) => $isLayoutItemNode(node)
      )
      activeLayoutItemKeyRef.current = $isLayoutItemNode(layoutItem)
        ? layoutItem.getKey()
        : null

      const node = getSelectedNode(selection)
      const parent = node.getParent()

      let matchingParent
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline()
        )
      }
      setElementFormat(
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || "left"
      )
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const handleValueChange = (value: string) => {
    if (!value) return // Prevent unselecting current value

    setElementFormat(value as ElementFormatType)

    if (value === "indent") {
      activeEditor.update(() => {
        const selectedLayoutItemKey = activeLayoutItemKeyRef.current
        if (selectedLayoutItemKey) {
          const node = $getNodeByKey(selectedLayoutItemKey)
          if ($isLayoutItemNode(node)) {
            const currentPadding = extractPadding(node.getStyle()) ?? 0
            const nextPadding = Math.min(currentPadding + 4, 64)
            node.setStyle(setPadding(node.getStyle(), nextPadding))
            return
          }
        }

        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
          return
        }
        const layoutItem = $findMatchingParent(
          selection.anchor.getNode(),
          (node) => $isLayoutItemNode(node)
        )
        if ($isLayoutItemNode(layoutItem)) {
          const currentPadding = extractPadding(layoutItem.getStyle()) ?? 0
          const nextPadding = Math.min(currentPadding + 4, 64)
          layoutItem.setStyle(setPadding(layoutItem.getStyle(), nextPadding))
          return
        }
        activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
      })
    } else if (value === "outdent") {
      activeEditor.update(() => {
        const selectedLayoutItemKey = activeLayoutItemKeyRef.current
        if (selectedLayoutItemKey) {
          const node = $getNodeByKey(selectedLayoutItemKey)
          if ($isLayoutItemNode(node)) {
            const currentPadding = extractPadding(node.getStyle()) ?? 0
            const nextPadding = Math.max(currentPadding - 4, 0)
            node.setStyle(setPadding(node.getStyle(), nextPadding))
            return
          }
        }

        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
          return
        }
        const layoutItem = $findMatchingParent(
          selection.anchor.getNode(),
          (node) => $isLayoutItemNode(node)
        )
        if ($isLayoutItemNode(layoutItem)) {
          const currentPadding = extractPadding(layoutItem.getStyle()) ?? 0
          const nextPadding = Math.max(currentPadding - 4, 0)
          layoutItem.setStyle(setPadding(layoutItem.getStyle(), nextPadding))
          return
        }
        activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
      })
    } else {
      let handledByTable = false
      activeEditor.update(() => {
        const selection = $getSelection()
        if (!selection) return
        const tableNode = $getCurrentTableNode(selection)
        if (!tableNode) return
        const cells = getTableCellsInSelectionForTable(selection, tableNode)
        if (cells.length === 0) return
        for (const cell of cells) {
          applyAlignmentToTableCell(cell, value as ElementFormatType)
        }
        handledByTable = true
      })
      if (!handledByTable) {
        activeEditor.dispatchCommand(
          FORMAT_ELEMENT_COMMAND,
          value as ElementFormatType
        )
      }
    }
  }

  return (
    <>
      {/* Alignment toggles */}
      {Object.entries(ELEMENT_FORMAT_OPTIONS).map(([value, option]) => (
        <Button
          key={value}
          variant="outline"
          size="sm"
          aria-label={option.name}
          data-state={elementFormat === value ? "on" : "off"}
          onMouseDown={(event) => {
            // Keep table/range selection when clicking toolbar button.
            event.preventDefault()
          }}
          onPointerDown={(event) => {
            event.preventDefault()
          }}
          onClick={() => handleValueChange(value)}
          className="editor-toolbar-item"
        >
          {option.icon}
        </Button>
      ))}

      {separator && (
        <Separator
          orientation="vertical"
          className="editor-toolbar-separator"
        />
      )}

      {/* Indentation toggles */}
      <Button
        variant="outline"
        size="sm"
        aria-label="Outdent"
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => handleValueChange("outdent")}
        className="editor-toolbar-item"
      >
        <IconSize size="sm">
          <IndentDecreaseIcon />
        </IconSize>
      </Button>

      <Button
        variant="outline"
        size="sm"
        aria-label="Indent"
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          event.preventDefault()
        }}
        onClick={() => handleValueChange("indent")}
        className="editor-toolbar-item"
      >
        <IconSize size="sm">
          <IndentIncreaseIcon />
        </IconSize>
      </Button>
    </>
  )
}
