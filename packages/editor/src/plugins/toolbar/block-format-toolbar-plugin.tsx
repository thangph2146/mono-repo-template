"use client"

import { $isListNode, ListNode } from "@lexical/list"
import { $isHeadingNode } from "@lexical/rich-text"
import { $findMatchingParent, $getNearestNodeOfType } from "@lexical/utils"
import {
  $isRangeSelection,
  $isRootOrShadowRoot,
  BaseSelection,
} from "lexical"
import { useCallback } from "react"

import {
  isListToolbarBlockType,
  listStateToToolbarBlockType,
} from "../../config/editor-list-config"
import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { $isListWithColorNode } from "../../nodes/list-with-color-node"
import { blockTypeToBlockName } from "../../plugins/toolbar/block-format/block-format-data"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "../../ui/select"

/** Khi con trỏ trong list: dropdown block format không dùng value list (đã có ListFormatDropDown). */
const BLOCK_FORMAT_SELECT_WHEN_IN_LIST_VALUE =
  "__editor_block_format_while_in_list__" as const

export function BlockFormatDropDown({
  children,
}: {
  children: React.ReactNode
}) {
  const { activeEditor, blockType, setBlockType } = useToolbarContext()

  const inList = isListToolbarBlockType(blockType)
  const currentBlockType = inList
    ? BLOCK_FORMAT_SELECT_WHEN_IN_LIST_VALUE
    : blockTypeToBlockName[blockType]
      ? blockType
      : "paragraph"
  const currentBlockMeta = inList
    ? blockTypeToBlockName.paragraph
    : blockTypeToBlockName[currentBlockType]

  /**
   * Updates the toolbar state based on the current selection.
   * Identifies if the cursor is in a List, Heading, or other block type.
   */
  const $updateToolbar = useCallback(
    (selection: BaseSelection) => {
      if (!$isRangeSelection(selection)) {
        setBlockType("paragraph")
        return
      }

      try {
        const anchorNode = selection.anchor.getNode()
        
        // Find the top-level element or the nearest parent that is a root/shadow root
        let element =
          anchorNode.getKey() === "root"
            ? anchorNode
            : $findMatchingParent(anchorNode, (e) => {
                const parent = e.getParent()
                return parent !== null && $isRootOrShadowRoot(parent)
              })

        if (element === null) {
          try {
            element = anchorNode.getTopLevelElementOrThrow()
          } catch {
            // If no element found, reset to paragraph
            setBlockType("paragraph")
            return
          }
        }

        const elementKey = element.getKey()
        const elementDOM = activeEditor.getElementByKey(elementKey)
        const elementType = element.getType()

        if (elementDOM !== null) {
          if ($isListNode(element)) {
            const parentList = $getNearestNodeOfType<ListNode>(
              anchorNode,
              ListNode
            )
            const listNode = parentList || element
            let type: string = listNode.getListType()

            if ($isListWithColorNode(listNode)) {
              const lt = listNode.getListType()
              if (lt === "bullet" || lt === "number") {
                type = listStateToToolbarBlockType(lt, listNode.getMarkerType())
              }
            }
            setBlockType(type)
          } else if ($isHeadingNode(element)) {
            const type = element.getTag()
            setBlockType(type as keyof typeof blockTypeToBlockName)
          } else if (elementType === "code") {
            setBlockType("code")
          } else {
            // For any other block type (paragraph, etc)
            const type = elementType
            if (type in blockTypeToBlockName) {
              setBlockType(type as keyof typeof blockTypeToBlockName)
            } else {
              setBlockType("paragraph")
            }
          }
        } else {
          setBlockType("paragraph")
        }
      } catch {
        // If any error occurs, reset to paragraph
        setBlockType("paragraph")
      }
    },
    [activeEditor, setBlockType]
  )

  useUpdateToolbarHandler($updateToolbar)

  return (
    <Select
      modal={false}
      value={currentBlockType}
      onValueChange={(value) => {
        if (value === BLOCK_FORMAT_SELECT_WHEN_IN_LIST_VALUE) return
        if (value in blockTypeToBlockName) {
          setBlockType(value as keyof typeof blockTypeToBlockName)
        }
      }}
    >
      <SelectTrigger className="editor-toolbar-select-trigger editor-toolbar-select-trigger--w-md">
        <div className="editor-toolbar-select-icon">
          {currentBlockMeta?.icon}
        </div>
        <span className="editor-truncate editor-block-format-label">{currentBlockMeta?.label}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  )
}
