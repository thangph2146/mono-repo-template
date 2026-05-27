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
import { $createTableNodeWithDimensions, TableNode } from "@lexical/table"
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

// Re-export dialog from isolated location
export { InsertTableDialog } from "../editor-ui/dialogs"

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
        const rows = Number(payload.rows) || 3
        const cols = Number(payload.columns) || 3
        const includeHeaders = payload.includeHeaders ?? false
        editor.update(
          () => {
            const root = $getRoot()
            const tableNode = $createTableNodeWithDimensions(
              rows,
              cols,
              includeHeaders
            )
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
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  return null
}
