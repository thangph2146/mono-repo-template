import {
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  type TableCellNode,
  TableNode,
} from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import {
  $isNodeSelection,
  $isRangeSelection,
  type BaseSelection,
  type LexicalNode,
} from "lexical"

/** Bảng đang chứa selection (ô / nhiều ô / range trong ô). */
export function $getCurrentTableNode(selection: BaseSelection | null): TableNode | null {
  if (!selection) return null

  if ($isTableSelection(selection)) {
    for (const node of selection.getNodes()) {
      if ($isTableCellNode(node)) {
        let walk: LexicalNode | null = node
        while (walk !== null) {
          if (walk instanceof TableNode) return walk
          walk = walk.getParent()
        }
      }
    }
    return null
  }

  if ($isNodeSelection(selection)) {
    for (const node of selection.getNodes()) {
      if (node instanceof TableNode) return node
      const cellParent = $findMatchingParent(node, $isTableCellNode)
      if (cellParent && $isTableCellNode(cellParent)) {
        const parent = cellParent.getParent()
        if (parent instanceof TableNode) return parent
      }
    }
    return null
  }

  if (!$isRangeSelection(selection)) return null

  let node: LexicalNode = selection.anchor.getNode()
  if ($isTableCellNode(node)) {
    const parent = node.getParent()
    return parent instanceof TableNode ? parent : null
  }

  while (node) {
    if (node instanceof TableNode) return node
    const parent = node.getParent()
    if (parent === null) return null
    node = parent
  }

  return null
}

export function $isTableCellMerged(cell: TableCellNode): boolean {
  const colSpan =
    typeof (cell as { getColSpan?: () => number }).getColSpan === "function"
      ? (cell as { getColSpan: () => number }).getColSpan()
      : (cell as { __colSpan?: number }).__colSpan ?? 1
  const rowSpan =
    typeof (cell as { getRowSpan?: () => number }).getRowSpan === "function"
      ? (cell as { getRowSpan: () => number }).getRowSpan()
      : (cell as { __rowSpan?: number }).__rowSpan ?? 1
  return colSpan > 1 || rowSpan > 1
}

/** Có thể gộp khi chọn table selection với ≥ 2 ô khác nhau. */
export function $canMergeTableSelection(selection: BaseSelection | null): boolean {
  if (!selection || !$isTableSelection(selection)) return false
  const seen = new Set<string>()
  for (const n of selection.getNodes()) {
    const cell = $findMatchingParent(n, $isTableCellNode)
    if (cell && $isTableCellNode(cell) && !seen.has(cell.getKey())) {
      seen.add(cell.getKey())
    }
  }
  return seen.size >= 2
}

/** Selection đang nằm trong ô đã gộp (range hoặc table selection). */
export function $canUnmergeAtSelection(selection: BaseSelection | null): boolean {
  if (!selection) return false
  if ($isRangeSelection(selection)) {
    const cell = $findMatchingParent(selection.anchor.getNode(), $isTableCellNode)
    return $isTableCellNode(cell) && $isTableCellMerged(cell)
  }
  if ($isTableSelection(selection)) {
    const seen = new Set<string>()
    for (const n of selection.getNodes()) {
      const cell = $findMatchingParent(n, $isTableCellNode)
      if (cell && $isTableCellNode(cell) && !seen.has(cell.getKey())) {
        seen.add(cell.getKey())
        if ($isTableCellMerged(cell)) return true
      }
    }
  }
  return false
}

export function $getTableRowCount(table: TableNode): number {
  return table.getChildren().filter((n) => $isTableRowNode(n)).length
}

/** Chỉ cho phép xóa dòng khi bảng còn > 1 hàng. */
export function $canDeleteTableRowAtSelection(selection: BaseSelection | null): boolean {
  const table = $getCurrentTableNode(selection)
  if (!table) return false
  return $getTableRowCount(table) > 1
}

/** Chỉ cho phép xóa cột khi bảng còn > 1 cột. */
export function $canDeleteTableColumnAtSelection(selection: BaseSelection | null): boolean {
  const table = $getCurrentTableNode(selection)
  if (!table) return false
  return table.getColumnCount() > 1
}
