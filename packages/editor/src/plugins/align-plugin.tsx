"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $isTableCellNode,
  $isTableSelection,
  type TableCellNode,
  TableNode,
} from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_EDITOR,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  LexicalNode,
} from "lexical"
import { useEffect } from "react"

function $collectTableCellsFromNodes(nodes: LexicalNode[]) {
  const cells = new Map<string, TableCellNode>()
  const addCell = (node: LexicalNode) => {
    if ($isTableCellNode(node)) {
      cells.set(node.getKey(), node)
      return
    }

    const cellParent = $findMatchingParent(node, $isTableCellNode)
    if (cellParent && $isTableCellNode(cellParent)) {
      cells.set(cellParent.getKey(), cellParent)
    }
  }

  const walkAllCellsInTableNode = (tableNode: TableNode) => {
    const stack: LexicalNode[] = [...tableNode.getChildren()]
    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue
      if ($isTableCellNode(current)) {
        cells.set(current.getKey(), current)
        continue
      }
      if ($isElementNode(current)) {
        stack.push(...current.getChildren())
      }
    }
  }

  nodes.forEach((node) => {
    addCell(node)
    if (node instanceof TableNode) {
      walkAllCellsInTableNode(node)
    }
  })

  return Array.from(cells.values()).filter($isTableCellNode)
}

/** Inline `text-align` on blocks inside a cell overrides td alignment in the browser. */
function stripTextAlignFromInlineStyle(style: string): string {
  if (!style.trim()) return ""
  let s = style.replace(/text-align\s*:\s*[^;]+;?/gi, "")
  s = s.replace(/\s*;\s*;/g, ";").replace(/^;+|;+$/g, "").trim()
  return s
}

function $applyAlignmentToTableCell(
  cell: TableCellNode,
  formatType: ElementFormatType
) {
  cell.setFormat(formatType)

  const visit = (node: LexicalNode) => {
    if (node instanceof TableNode) {
      return
    }
    if ($isElementNode(node) && !node.isInline()) {
      node.setFormat(formatType)
      const style = node.getStyle()
      if (style && /text-align\s*:/i.test(style)) {
        node.setStyle(stripTextAlignFromInlineStyle(style))
      }
    }
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        visit(child)
      }
    }
  }

  for (const child of cell.getChildren()) {
    visit(child)
  }
}

export function AlignPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Ensure theme has textAlign configuration
    // This handles cases where the consumer app's theme might be missing these definitions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = editor._config as any
    if (config.theme && !config.theme.textAlign) {
      // eslint-disable-next-line react-hooks/immutability
      config.theme.textAlign = {
        left: "editor-text-align-left",
        center: "editor-text-align-center",
        right: "editor-text-align-right",
        justify: "editor-text-align-justify",
      }
    }

    return editor.registerCommand<ElementFormatType>(
      FORMAT_ELEMENT_COMMAND,
      (formatType) => {
        const selection = $getSelection()
        if (!selection) {
          return true
        }

        if (
          $isTableSelection(selection) ||
          $isRangeSelection(selection) ||
          $isNodeSelection(selection)
        ) {
          const tableCells = $collectTableCellsFromNodes(selection.getNodes())
          if (tableCells.length > 0) {
            tableCells.forEach((cell) => {
              $applyAlignmentToTableCell(cell, formatType)
            })
            return true
          }
        }

        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes()
          const processedBlocks = new Set<string>()

          nodes.forEach((node) => {
            let block: LexicalNode | null = node
            // Navigate up to find the nearest block element
            if (!$isElementNode(block) || block.isInline()) {
              const parent = block.getParentOrThrow()
              block = parent
            }
            
            // Continue navigating up if it's still inline (just in case)
            while (block !== null && (!$isElementNode(block) || block.isInline())) {
               block = block.getParent()
            }

            if (block && $isElementNode(block) && !processedBlocks.has(block.getKey())) {
              processedBlocks.add(block.getKey())
              block.setFormat(formatType)
            }
          })
        } else if ($isNodeSelection(selection)) {
           const nodes = selection.getNodes()
           const processedBlocks = new Set<string>()
           
           nodes.forEach((node) => {
             // For NodeSelection (e.g. ImageNode), find the parent block
             let block = node.getParent()
             while (block !== null && (!$isElementNode(block) || block.isInline())) {
                block = block.getParent()
             }

             if (block && $isElementNode(block) && !processedBlocks.has(block.getKey())) {
                processedBlocks.add(block.getKey())
                block.setFormat(formatType)
             }
           })
        }
        
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
