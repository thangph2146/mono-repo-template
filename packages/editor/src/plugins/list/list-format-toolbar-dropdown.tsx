"use client"

import type { JSX } from "react"
import { useCallback, useState } from "react"
import { ListIcon } from "lucide-react"
import { $findMatchingParent } from "@lexical/utils"
import { $isListItemNode, $isListNode } from "@lexical/list"
import {
  $isRangeSelection,
  BaseSelection,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical"

import {
  LIST_TOOLBAR_DROPDOWN_LABEL,
  LIST_TOOLBAR_PLACEHOLDER_VALUE,
  LIST_MAX_INDENT_DEPTH,
  isListToolbarBlockType,
} from "../../config/editor-list-config"
import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { blockTypeToBlockName } from "../toolbar/block-format/block-format-data"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../../ui/select"
import { IconSize } from "../../ui/typography"

const LIST_LEVEL_PLACEHOLDER_VALUE = "__editor_list_level__" as const

function getListDepthFromSelection(selection: BaseSelection): number {
  if (!$isRangeSelection(selection)) return 0
  const anchor = selection.anchor.getNode()
  const li = $findMatchingParent(anchor, $isListItemNode)
  if (!li || !$isListItemNode(li)) return 0

  let depth = 0
  let currentList = li.getParent()
  while (currentList && $isListNode(currentList)) {
    depth += 1
    const listParent = currentList.getParent()
    if (!listParent) break
    const parentListItem = $isListItemNode(listParent) ? listParent : null
    if (!parentListItem) break
    currentList = parentListItem.getParent()
  }
  return depth
}

/**
 * Dropdown toolbar riêng cho mọi kiểu list (Lexical ListPlugin / CheckListPlugin).
 * Tách khỏi dropdown block format chính (paragraph, heading, code, quote).
 */
export function ListFormatDropDown({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const { blockType } = useToolbarContext()

  const inList = isListToolbarBlockType(blockType)
  const selectValue = inList ? blockType : LIST_TOOLBAR_PLACEHOLDER_VALUE
  const meta = inList ? blockTypeToBlockName[blockType] : undefined

  return (
    <Select
      modal={false}
      value={selectValue}
      onValueChange={(value) => {
        if (value === LIST_TOOLBAR_PLACEHOLDER_VALUE) return
        
        // This logic handles when the user selects an option from the dropdown
        // that corresponds to an actual command (not the placeholder)
        // However, the actual command execution is handled by the `onPointerDown`
        // of each `SelectItem` in the components like `FormatBulletedList`
      }}
    >
      <SelectTrigger
        className="editor-toolbar-select-trigger editor-toolbar-select-trigger--w-md"
        aria-label={LIST_TOOLBAR_DROPDOWN_LABEL}
      >
        <div className="editor-toolbar-select-icon">
          {meta?.icon ?? (
            <IconSize size="sm">
              <ListIcon />
            </IconSize>
          )}
        </div>
        <span className="editor-truncate editor-block-format-label">
          {meta?.label ?? LIST_TOOLBAR_DROPDOWN_LABEL}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function ListLevelDropDown(): JSX.Element {
  const { activeEditor, blockType } = useToolbarContext()

  const inList = isListToolbarBlockType(blockType)
  const [listDepth, setListDepth] = useState<number>(0)

  const $updateToolbar = useCallback((selection: BaseSelection) => {
    setListDepth(getListDepthFromSelection(selection))
  }, [])

  useUpdateToolbarHandler($updateToolbar)

  const setDepth = useCallback(
    (targetDepth: number) => {
      const diff = targetDepth - listDepth
      if (diff === 0) return
      const command = diff > 0 ? INDENT_CONTENT_COMMAND : OUTDENT_CONTENT_COMMAND
      const steps = Math.abs(diff)
      for (let i = 0; i < steps; i += 1) {
        activeEditor.dispatchCommand(command, undefined)
      }
    },
    [activeEditor, listDepth]
  )

  const selectValue =
    inList && listDepth > 0 ? `__editor_list_level_${listDepth}__` : LIST_LEVEL_PLACEHOLDER_VALUE

  const maxDepth = LIST_MAX_INDENT_DEPTH

  return (
    <Select
      modal={false}
      value={selectValue}
      disabled={!inList}
      onValueChange={(value) => {
        if (!inList) return
        const match = value.match(/^__editor_list_level_(\d+)__$/)
        if (!match) return
        const n = Number(match[1])
        if (!Number.isFinite(n) || n <= 0) return
        setDepth(n)
      }}
    >
      <SelectTrigger
        className="editor-toolbar-select-trigger editor-toolbar-select-trigger--w-md"
        aria-label="Cấp list"
      >
        <div className="editor-toolbar-select-icon">
          <IconSize size="sm">
            <ListIcon />
          </IconSize>
        </div>
        <span className="editor-truncate editor-block-format-label">
          {inList && listDepth > 0 ? `Cấp ${listDepth}` : "Cấp"}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Array.from({ length: maxDepth }, (_, i) => i + 1).map((level) => (
            <SelectItem
              key={level}
              value={`__editor_list_level_${level}__`}
            >
              Cấp {level}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
