"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  createContext,
  JSX,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $createTableNodeWithDimensions,
  TableNode,
} from "@lexical/table"
import {
  $insertNodes,
  $getSelection,
  $getRoot,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  EditorThemeClasses,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
} from "lexical"

import { invariant } from "../shared/invariant"
import { Button } from "../ui/button"
import { DialogFooter } from "../ui/dialog"
import { Flex } from "../ui/flex"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export type InsertTableCommandPayload = Readonly<{
  columns: string
  rows: string
  includeHeaders?: boolean
}>

export type CellContextShape = {
  cellEditorConfig: null | CellEditorConfig
  cellEditorPlugins: null | JSX.Element | Array<JSX.Element>
  set: (
    cellEditorConfig: null | CellEditorConfig,
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>
  ) => void
}

export type CellEditorConfig = Readonly<{
  namespace: string
  nodes?: ReadonlyArray<Klass<LexicalNode>>
  onError: (error: Error, editor: LexicalEditor) => void
  readOnly?: boolean
  theme?: EditorThemeClasses
}>

export const INSERT_NEW_TABLE_COMMAND: LexicalCommand<InsertTableCommandPayload> =
  createCommand("INSERT_NEW_TABLE_COMMAND")

/** Chèn bảng vào editor (dùng trong dialog hoặc command handler) */
function insertTableIntoEditor(
  editor: LexicalEditor,
  payload: InsertTableCommandPayload
): void {
  const rows = Number(payload.rows) || 3
  const cols = Number(payload.columns) || 3
  const includeHeaders = payload.includeHeaders ?? false
  editor.update(
    () => {
      const root = $getRoot()
      const tableNode = $createTableNodeWithDimensions(rows, cols, includeHeaders)
      try {
        const selection = $getSelection()
        let targetBlock: ReturnType<typeof root.getFirstChild> = null
        if (selection !== null && $isRangeSelection(selection)) {
          try {
            targetBlock = selection.anchor.getNode().getTopLevelElementOrThrow()
          } catch {
            targetBlock = root.getLastChild()
          }
        } else {
          targetBlock = root.getLastChild()
        }
        if (targetBlock) {
          targetBlock.insertAfter(tableNode)
        } else {
          root.append(tableNode)
        }
      } catch {
        root.selectEnd()
        $insertNodes([tableNode])
      }
    },
    { tag: "insert-table" }
  )
}

export const CellContext = createContext<CellContextShape>({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  },
})

export function TableContext({ children }: { children: JSX.Element }) {
  const [contextValue, setContextValue] = useState<{
    cellEditorConfig: null | CellEditorConfig
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>
  }>({
    cellEditorConfig: null,
    cellEditorPlugins: null,
  })
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins })
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  )
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor
  onClose: () => void
}): JSX.Element {
  const [rows, setRows] = useState("5")
  const [columns, setColumns] = useState("5")
  const [includeHeaders, setIncludeHeaders] = useState(true)

  // Cho phép tùy chỉnh số cột/dòng; giới hạn 1–100 cột, 1–500 dòng
  const isDisabled = useMemo(() => {
    const row = Number(rows)
    const column = Number(columns)
    return !(row && row > 0 && row <= 500 && column && column > 0 && column <= 100)
  }, [rows, columns])

  const onClick = () => {
    const payload = { columns, rows, includeHeaders }
    onClose()
    const rootEl = activeEditor.getRootElement()
    rootEl?.focus({ preventScroll: false })
    // Chèn bảng trực tiếp bằng editor.update (không qua command) để luôn hoạt động
    setTimeout(() => {
      insertTableIntoEditor(activeEditor, payload)
    }, 150)
  }

  return (
    <div className="editor-table-dialog">
      <Flex direction="column" gap={4}>
        <Flex gap={4}>
          <div className="editor-table-dialog__group editor-flex-1">
            <Label htmlFor="rows" className="editor-mb-2">
              Số dòng
            </Label>
            <Input
              id="rows"
              placeholder="Ví dụ: 5"
              onChange={(e) => setRows(e.target.value)}
              value={rows}
              data-test-id="table-modal-rows"
              type="number"
              min={1}
              max={500}
            />
          </div>
          <div className="editor-table-dialog__group editor-flex-1">
            <Label htmlFor="columns" className="editor-mb-2">
              Số cột
            </Label>
            <Input
              id="columns"
              placeholder="Ví dụ: 5"
              onChange={(e) => setColumns(e.target.value)}
              value={columns}
              data-test-id="table-modal-columns"
              type="number"
              min={1}
              max={100}
            />
          </div>
        </Flex>

        <Flex
            align="center"
            gap={2}
            className="editor-table-dialog__checkbox-group"
          >
            <input
              id="include-headers"
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="editor-checkbox"
            />
            <Label htmlFor="include-headers" className="editor-label--normal">
              Dòng đầu làm hàng tiêu đề
            </Label>
          </Flex>

          <div className="editor-text-xs-muted">
            Sau khi chèn, đặt con trỏ trong bảng rồi mở mục{" "}
            <span className="editor-font-medium">Bảng</span> trên toolbar để gộp/tách ô, chèn hoặc xóa dòng/cột.
          </div>

          <DialogFooter data-test-id="table-modal-confirm-insert" className="editor-px-0 editor-mt-2">
            <Button
              disabled={isDisabled}
              onClick={onClick}
              className="editor-w-full"
            >
              Chèn bảng
            </Button>
          </DialogFooter>
        </Flex>
    </div>
  )
}

export function TablePlugin({
  cellEditorConfig,
  children,
}: {
  cellEditorConfig: CellEditorConfig
  children: JSX.Element | Array<JSX.Element>
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const cellContext = useContext(CellContext)

  useEffect(() => {
    if (!editor.hasNodes([TableNode])) {
      invariant(false, "TablePlugin: TableNode is not registered on editor")
    }

    cellContext.set(cellEditorConfig, children)

    return editor.registerCommand<InsertTableCommandPayload>(
      INSERT_NEW_TABLE_COMMAND,
      ({ columns, rows, includeHeaders }) => {
        const tableNode = $createTableNodeWithDimensions(
          Number(rows),
          Number(columns),
          includeHeaders
        )
        $insertNodes([tableNode])
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [cellContext, cellEditorConfig, children, editor])

  return null
}

/**
 * Plugin chỉ đăng ký INSERT_NEW_TABLE_COMMAND để Insert Table tạo đúng node bảng.
 * Dùng thay cho TablePlugin đầy đủ khi không cần cellEditorConfig.
 */
export function InsertTableCommandPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([TableNode])) return

    return editor.registerCommand<InsertTableCommandPayload>(
      INSERT_NEW_TABLE_COMMAND,
      (payload) => {
        insertTableIntoEditor(editor, payload)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
