"use client"

import { useCallback, useState } from "react"
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
} from "@lexical/table"
import { $findMatchingParent } from "@lexical/utils"
import { $getSelection, type BaseSelection } from "lexical"
import {
  Columns3,
  Combine,
  Rows3,
  SplitSquareVertical,
  TableProperties,
  Trash2,
} from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../../ui/select"
import { Flex } from "../../ui/flex"
import { IconSize } from "../../ui/typography"
import {
  $canDeleteTableColumnAtSelection,
  $canDeleteTableRowAtSelection,
  $canMergeTableSelection,
  $canUnmergeAtSelection,
  $getCurrentTableNode,
} from "./table-toolbar-utils"

export function TableActionsToolbarPlugin() {
  const { activeEditor } = useToolbarContext()
  const [insideTable, setInsideTable] = useState(false)
  const [canMerge, setCanMerge] = useState(false)
  const [canUnmerge, setCanUnmerge] = useState(false)
  const [canDeleteRow, setCanDeleteRow] = useState(false)
  const [canDeleteColumn, setCanDeleteColumn] = useState(false)

  const updateTableToolbar = useCallback((selection: BaseSelection) => {
    const inTable = $getCurrentTableNode(selection) !== null
    setInsideTable(inTable)
    if (!inTable) {
      setCanMerge(false)
      setCanUnmerge(false)
      setCanDeleteRow(false)
      setCanDeleteColumn(false)
      return
    }
    setCanMerge($canMergeTableSelection(selection))
    setCanUnmerge($canUnmergeAtSelection(selection))
    setCanDeleteRow($canDeleteTableRowAtSelection(selection))
    setCanDeleteColumn($canDeleteTableColumnAtSelection(selection))
  }, [])

  useUpdateToolbarHandler(updateTableToolbar)

  const runMerge = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection()
      if (!$isTableSelection(selection)) return
      const seen = new Set<string>()
      const cellNodes: import("@lexical/table").TableCellNode[] = []
      for (const n of selection.getNodes()) {
        const cell = $findMatchingParent(n, $isTableCellNode)
        if (cell && $isTableCellNode(cell) && !seen.has(cell.getKey())) {
          seen.add(cell.getKey())
          cellNodes.push(cell)
        }
      }
      if (cellNodes.length >= 2) $mergeCells(cellNodes)
    })
  }, [activeEditor])

  const runUnmerge = useCallback(() => {
    activeEditor.update(() => {
      $unmergeCell()
    })
  }, [activeEditor])

  if (!insideTable) return null

  return (
    <Select value="" modal={false}>
      <SelectTrigger
        className="editor-toolbar-item editor-toolbar-item--w-auto editor-toolbar-item--gap-sm editor-toolbar-select-trigger editor-toolbar-select-trigger--w-auto"
        title="Thao tác ô bảng"
        aria-label="Thao tác ô bảng"
      >
        <IconSize size="sm">
          <TableProperties />
        </IconSize>
        <span>Bảng</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Ô đã chọn</SelectLabel>
          <SelectItem
            value="__merge"
            className={!canMerge ? "editor-select-item--disabled" : undefined}
            onPointerUp={() => {
              if (!canMerge) return
              runMerge()
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Combine />
              </IconSize>
              <span>Gộp ô</span>
            </Flex>
          </SelectItem>
          <SelectItem
            value="__unmerge"
            className={!canUnmerge ? "editor-select-item--disabled" : undefined}
            onPointerUp={() => {
              if (!canUnmerge) return
              runUnmerge()
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <SplitSquareVertical />
              </IconSize>
              <span>Tách ô</span>
            </Flex>
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Chèn</SelectLabel>
          <SelectItem
            value="__col-right"
            onPointerUp={() => {
              activeEditor.update(() => $insertTableColumnAtSelection(true))
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Columns3 />
              </IconSize>
              <span>Chèn cột bên phải</span>
            </Flex>
          </SelectItem>
          <SelectItem
            value="__col-left"
            onPointerUp={() => {
              activeEditor.update(() => $insertTableColumnAtSelection(false))
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Columns3 />
              </IconSize>
              <span>Chèn cột bên trái</span>
            </Flex>
          </SelectItem>
          <SelectItem
            value="__row-below"
            onPointerUp={() => {
              activeEditor.update(() => $insertTableRowAtSelection(true))
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Rows3 />
              </IconSize>
              <span>Chèn dòng bên dưới</span>
            </Flex>
          </SelectItem>
          <SelectItem
            value="__row-above"
            onPointerUp={() => {
              activeEditor.update(() => $insertTableRowAtSelection(false))
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Rows3 />
              </IconSize>
              <span>Chèn dòng bên trên</span>
            </Flex>
          </SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Xóa</SelectLabel>
          <SelectItem
            value="__del-row"
            className={
              !canDeleteRow ? "editor-select-item--disabled" : undefined
            }
            onPointerUp={() => {
              if (!canDeleteRow) return
              activeEditor.update(() => $deleteTableRowAtSelection())
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Trash2 />
              </IconSize>
              <span>Xóa dòng hiện tại</span>
            </Flex>
          </SelectItem>
          <SelectItem
            value="__del-col"
            className={
              !canDeleteColumn ? "editor-select-item--disabled" : undefined
            }
            onPointerUp={() => {
              if (!canDeleteColumn) return
              activeEditor.update(() => $deleteTableColumnAtSelection())
            }}
          >
            <Flex align="center" gap={2}>
              <IconSize size="sm">
                <Trash2 />
              </IconSize>
              <span>Xóa cột hiện tại</span>
            </Flex>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
