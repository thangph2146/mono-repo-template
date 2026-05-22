"use client"

/**
 * Insert Table Dialog Component
 *
 * Extracted from table-plugin.tsx to avoid cross-plugin imports.
 * Consumed by: toolbar/block-insert, picker/table-picker, table-plugin
 */
import { INSERT_TABLE_COMMAND } from "@lexical/table"
import { JSX, useMemo, useState } from "react"
import type { LexicalEditor } from "lexical"

import { Button } from "../../ui/button"
import { DialogFooter } from "../../ui/dialog"
import { Flex } from "../../ui/flex"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"

export type InsertTableDialogProps = {
  activeEditor: LexicalEditor
  onClose: () => void
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: InsertTableDialogProps): JSX.Element {
  const [rows, setRows] = useState("5")
  const [columns, setColumns] = useState("5")
  const [includeHeaders, setIncludeHeaders] = useState(true)

  const isDisabled = useMemo(() => {
    const row = Number(rows)
    const column = Number(columns)
    return !(
      row &&
      row > 0 &&
      row <= 500 &&
      column &&
      column > 0 &&
      column <= 100
    )
  }, [rows, columns])

  const onClick = () => {
    onClose()
    const rootEl = activeEditor.getRootElement()
    rootEl?.focus({ preventScroll: false })
    setTimeout(() => {
      activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns,
        rows,
        includeHeaders,
      })
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
          <span className="editor-font-medium">Bảng</span> trên toolbar để
          gộp/tách ô, chèn hoặc xóa dòng/cột.
        </div>

        <DialogFooter
          data-test-id="table-modal-confirm-insert"
          className="editor-px-0 editor-mt-2"
        >
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
