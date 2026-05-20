"use client"

import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  useCallback,
} from "react"
import { createPortal } from "react-dom"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalEditable } from "@lexical/react/useLexicalEditable"
import {
  $computeTableMapSkipCellCheck,
  $getTableNodeFromLexicalNodeOrThrow,
  $isTableCellNode,
  TableNode,
} from "@lexical/table"
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  type NodeKey,
} from "lexical"

type ResizeEdge = "left" | "right"

type DragState = {
  tableKey: NodeKey
  columnIndex: number
  startX: number
  startWidth: number
  initialColWidths: readonly number[]
}

type HoverState = {
  cellKey: NodeKey
  tableKey: NodeKey
  edge: ResizeEdge
}

const EDGE_HITBOX_PX = 8

/** Độ rộng tối thiểu khi kéo cột (px) — nhỏ hơn để có thể thu hẹp cột như "TT" */
const MIN_COLUMN_WIDTH_PX = 15

function getCellTarget(
  target: EventTarget | null
): HTMLTableCellElement | null {
  if (!target) return null
  let node = target as Node
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode as Node
  }
  if (!(node instanceof HTMLElement)) return null
  const cell = node.closest("th, td")
  return cell instanceof HTMLTableCellElement ? cell : null
}

function getResizeEdge(clientX: number, rect: DOMRect): ResizeEdge | null {
  const nearLeft = Math.abs(clientX - rect.left) <= EDGE_HITBOX_PX
  const nearRight = Math.abs(clientX - rect.right) <= EDGE_HITBOX_PX

  if (!nearLeft && !nearRight) return null
  if (nearLeft && nearRight) return "right"
  return nearLeft ? "left" : "right"
}

function $getColumnIndexFromTableMap(
  tableNode: TableNode,
  tableCellNode: ReturnType<typeof $getNearestNodeFromDOMNode>
): number | null {
  if (!$isTableCellNode(tableCellNode)) return null
  const [tableMap] = $computeTableMapSkipCellCheck(tableNode, null, null)

  for (let row = 0; row < tableMap.length; row++) {
    const tableMapRow = tableMap[row]
    if (!tableMapRow) continue

    for (let column = 0; column < tableMapRow.length; column++) {
      const cell = tableMapRow[column]
      if (cell && cell.cell === tableCellNode) {
        return column
      }
    }
  }

  return null
}

export function TableColumnResizerPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement
}) {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const dragRef = useRef<DragState | null>(null)
  const [hoverState, setHoverState] = useState<HoverState | null>(null)
  const resizerRef = useRef<HTMLDivElement | null>(null)

  const onPointerDownImpl = useCallback(
    (event: PointerEvent, cell: HTMLTableCellElement, edge: ResizeEdge) => {
      if (event.button !== 0) return

      event.preventDefault()

      // Capture pointer to handle dragging outside the resizer handle
      const target = event.target as HTMLElement
      if (target) {
        target.setPointerCapture(event.pointerId)
      }

      let nextDragState: DragState | null = null

      editor.update(() => {
        const tableCellNode = $getNearestNodeFromDOMNode(cell)
        if (!$isTableCellNode(tableCellNode)) return

        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode)
        const tableElement = editor.getElementByKey(tableNode.getKey())
        if (!tableElement) return

        const tableMap = $computeTableMapSkipCellCheck(tableNode, null, null)[0]
        const colCount = tableMap[0]?.length ?? 0
        const columnIndexFromMap = $getColumnIndexFromTableMap(
          tableNode,
          tableCellNode
        )

        if (columnIndexFromMap === null) return

        const colSpan = tableCellNode.getColSpan()
        const resizeColumnIndex =
          edge === "left"
            ? columnIndexFromMap - 1
            : columnIndexFromMap + colSpan - 1

        if (resizeColumnIndex < 0 || resizeColumnIndex >= colCount - 1) return

        let currentWidths = tableNode.getColWidths()

        if (!currentWidths) {
          // If no widths are stored in the node, measure the actual table
          const columns = tableElement.querySelectorAll("col")
          const widths: number[] = []

          if (columns.length === colCount) {
            columns.forEach((col) => {
              const styleWidth = (col as HTMLElement).style.width
              if (styleWidth && styleWidth.endsWith("px")) {
                widths.push(parseFloat(styleWidth))
              } else {
                const rect = col.getBoundingClientRect()
                widths.push(rect.width || 0)
              }
            })
          }

          // If columns don't match or are missing, try to measure cells in the first row
          if (widths.length !== colCount) {
            const firstRow = tableElement.querySelector("tr")
            if (firstRow) {
              const cells = firstRow.querySelectorAll("th, td")
              // This is only accurate if there are no colSpans in the first row
              if (cells.length === colCount) {
                cells.forEach((cell) => {
                  widths.push(cell.getBoundingClientRect().width)
                })
              }
            }
          }

          // Fallback to average width if still missing
          if (widths.length !== colCount) {
            const tableRect = tableElement.getBoundingClientRect()
            const avgWidth = tableRect.width / (colCount || 1)
            for (let i = 0; i < colCount; i++) {
              widths.push(avgWidth)
            }
          }

          currentWidths = widths
        }

        if (
          currentWidths[resizeColumnIndex] === undefined ||
          currentWidths[resizeColumnIndex + 1] === undefined
        ) {
          return
        }

        nextDragState = {
          columnIndex: resizeColumnIndex,
          initialColWidths: currentWidths,
          startX: event.clientX,
          startWidth: currentWidths[resizeColumnIndex],
          tableKey: tableNode.getKey(),
        }
      })

      if (!nextDragState) return

      dragRef.current = nextDragState

      // Prevent text selection while dragging
      const rootElement = editor.getRootElement()
      if (rootElement) {
        rootElement.style.userSelect = "none"
        rootElement.style.cursor = "col-resize"
      }

      const onPointerMoveDocument = (event: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return

        event.preventDefault()
        const deltaX = event.clientX - drag.startX
        const { tableKey, columnIndex, initialColWidths } = drag

        editor.update(() => {
          const tableNode = $getNodeByKey(tableKey)
          if (!(tableNode instanceof TableNode)) return

          const currentWidths = tableNode.getColWidths() || initialColWidths
          const colCount = tableNode.getColumnCount()
          const nextColumnIndex = columnIndex + 1

          if (nextColumnIndex >= colCount) return

          const currentLeftWidth = initialColWidths[columnIndex]
          const currentRightWidth = initialColWidths[nextColumnIndex]

          if (currentLeftWidth === undefined || currentRightWidth === undefined)
            return

          const maxShrinkLeft = currentLeftWidth - MIN_COLUMN_WIDTH_PX
          const maxGrowLeft = currentRightWidth - MIN_COLUMN_WIDTH_PX

          // Clamp deltaX to ensure neither column shrinks below MIN_COLUMN_WIDTH_PX
          const constrainedDelta = Math.min(
            Math.max(deltaX, -maxShrinkLeft),
            maxGrowLeft
          )

          const newLeftWidth = currentLeftWidth + constrainedDelta
          const newRightWidth = currentRightWidth - constrainedDelta

          // Create a clean copy of widths, filling with measured values if needed
          const nextColWidths = Array.from({ length: colCount }, (_, i) => {
            if (i === columnIndex) return newLeftWidth
            if (i === nextColumnIndex) return newRightWidth
            return currentWidths[i] ?? initialColWidths[i] ?? 0
          })

          // Use the correct method to update widths if setColWidths is not standard
          if (
            typeof (tableNode as unknown as Record<string, unknown>)
              .setColWidths === "function"
          ) {
            ;(
              (tableNode as unknown as Record<string, unknown>)
                .setColWidths as (widths: number[]) => void
            )(nextColWidths)
          } else {
            // Fallback for different Lexical versions if needed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(tableNode as any).__colWidths = nextColWidths
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(tableNode as any).__widths = nextColWidths
            tableNode.markDirty()
          }
        })
      }

      const onPointerUpDocument = (event: PointerEvent) => {
        const drag = dragRef.current
        if (!drag) return

        const target = event.target as HTMLElement
        if (target && target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId)
        }

        dragRef.current = null
        const rootElement = editor.getRootElement()
        if (rootElement) {
          rootElement.style.userSelect = ""
          rootElement.style.cursor = ""
        }
        document.removeEventListener("pointermove", onPointerMoveDocument)
        document.removeEventListener("pointerup", onPointerUpDocument)
      }

      document.addEventListener("pointermove", onPointerMoveDocument)
      document.addEventListener("pointerup", onPointerUpDocument)
    },
    [editor]
  )

  const updateResizerPosition = useCallback(() => {
    const state = hoverState as HoverState | null
    if (state === null || !resizerRef.current) return

    const { cellKey, edge } = state
    const cell = editor.getElementByKey(cellKey)
    if (!cell) return

    const cellRect = cell.getBoundingClientRect()
    const anchorRect = anchorElem.getBoundingClientRect()

    const resizerElem = resizerRef.current

    // Find the table element to make the resizer span the entire table height
    const tableElement = cell.closest("table")
    let top = cellRect.top - anchorRect.top
    let height = cellRect.height

    if (tableElement) {
      const tableRect = tableElement.getBoundingClientRect()
      top = tableRect.top - anchorRect.top
      height = tableRect.height
    }

    // Position at the edge, centered (width is 16px, so center is edge - 8)
    const left =
      (edge === "left" ? cellRect.left : cellRect.right) - anchorRect.left - 8

    resizerElem.style.transform = `translate(${left}px, ${top}px)`
    resizerElem.style.height = `${height}px`
    resizerElem.style.opacity = "1"
  }, [editor, hoverState, anchorElem])

  useLayoutEffect(() => {
    updateResizerPosition()

    // Update on window resize and scroll
    window.addEventListener("resize", updateResizerPosition)
    window.addEventListener("scroll", updateResizerPosition, true)

    const updateListener = editor.registerUpdateListener(() => {
      editor.read(() => {
        const state = hoverState as HoverState | null
        if (state !== null) {
          const cell = editor.getElementByKey(state.cellKey)
          if (!cell) {
            setHoverState(null)
          } else {
            updateResizerPosition()
          }
        }
      })
    })

    return () => {
      window.removeEventListener("resize", updateResizerPosition)
      window.removeEventListener("scroll", updateResizerPosition, true)
      updateListener()
    }
  }, [editor, hoverState, updateResizerPosition])

  useEffect(() => {
    if (!isEditable) return

    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const setCursor = (cursor: string) => {
      if (rootElement) {
        rootElement.style.cursor = cursor
      }
    }

    const clearCursor = () => {
      setCursor("")
    }

    const onPointerMove = (event: PointerEvent) => {
      if (dragRef.current) return

      // Do not show resizer while dragging/selecting (any button is pressed)
      if (event.buttons !== 0) return

      // If we are over the resizer, don't clear hover state
      if (
        resizerRef.current &&
        (event.target === resizerRef.current ||
          resizerRef.current.contains(event.target as Node))
      ) {
        return
      }

      const cell = getCellTarget(event.target)

      let nextHoverState: HoverState | null = null

      if (cell) {
        editor.read(() => {
          const cellNode = $getNearestNodeFromDOMNode(cell)
          if ($isTableCellNode(cellNode)) {
            const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode)
            const cellKey = cellNode.getKey()
            const tableKey = tableNode.getKey()

            const edge = getResizeEdge(
              event.clientX,
              cell.getBoundingClientRect()
            )
            if (edge) {
              const colCount = tableNode.getColumnCount()
              const colSpan = cellNode.getColSpan()
              const columnIndexFromMap = $getColumnIndexFromTableMap(
                tableNode,
                cellNode
              )

              if (
                columnIndexFromMap !== null &&
                !(
                  (edge === "left" && columnIndexFromMap === 0) ||
                  (edge === "right" &&
                    columnIndexFromMap + colSpan === colCount)
                )
              ) {
                nextHoverState = { cellKey, tableKey, edge }
              }
            }
          }
        })
      }

      if (!nextHoverState) {
        if (hoverState !== null) {
          clearCursor()
          setHoverState(null)
        }
      } else {
        setCursor("col-resize")
        // @ts-ignore TypeScript narrowing bug with HoverState | null
        if (
          hoverState === null ||
          // @ts-ignore
          hoverState.cellKey !== nextHoverState.cellKey ||
          // @ts-ignore
          hoverState.edge !== nextHoverState.edge
        ) {
          setHoverState(nextHoverState)
        }
      }
    }

    anchorElem.addEventListener("pointermove", onPointerMove)

    return () => {
      anchorElem.removeEventListener("pointermove", onPointerMove)
      clearCursor()
    }
  }, [editor, isEditable, hoverState, anchorElem])

  const resizer = useMemo(() => {
    const state = hoverState as HoverState | null
    if (state === null) return null

    const { cellKey, edge } = state

    return createPortal(
      <div
        ref={resizerRef}
        className="editor-table-cell-resizer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "16px",
          opacity: 1,
          willChange: "transform",
          userSelect: "none",
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
          const cell = editor.getElementByKey(cellKey)
          if (cell instanceof HTMLTableCellElement) {
            onPointerDownImpl(event.nativeEvent, cell, edge)
          }
        }}
      >
        <div
          className="editor-table-cell-resize-ruler"
          style={{ pointerEvents: "none" }}
        />
      </div>,
      anchorElem
    )
  }, [hoverState, anchorElem, editor, onPointerDownImpl])

  return resizer
}
