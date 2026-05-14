import {
  REMOVE_LIST_COMMAND,
  $isListItemNode,
  $isListNode,
  $insertList,
} from "@lexical/list"
import { $findMatchingParent } from "@lexical/utils"
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  type LexicalNode,
  type NodeKey,
} from "lexical"

import type { ListMarkerPresetValue } from "../../../config/editor-list-config"
import { useToolbarContext } from "../../../context/toolbar-context"
import { $isListWithColorNode } from "../../../nodes/list-with-color-node"
import { createListWithColorNodeFromRegistry } from "../../../editor-x/nodes"
import { $tryPartialListTypeConversion } from "../../../plugins/list/partial-list-type-conversion"
import { blockTypeToBlockName } from "../../../plugins/toolbar/block-format/block-format-data"
import { Flex } from "../../../ui/flex"
import { SelectItem } from "../../../ui/select"

interface FormatBulletMarkerProps {
  blockFormatValue: string
  listType: "bullet"
  /** Preset từ `LIST_MARKER_PRESET` — đồng bộ `data-list-marker` / theme. */
  markerType: ListMarkerPresetValue
}

export function FormatBulletMarker({
  blockFormatValue,
  listType,
  markerType,
}: FormatBulletMarkerProps) {
  const { activeEditor, blockType } = useToolbarContext()

  const formatParagraph = () => {
    activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
  }

  const formatList = () => {
    if (blockType !== blockFormatValue) {
      activeEditor.update(() => {
        const selection = $getSelection()
        
        if (
          $isRangeSelection(selection) &&
          $tryPartialListTypeConversion(activeEditor, selection, listType, {
            markerType,
          })
        ) {
          // If conversion was handled, the marker was also set. We just need to exit.
          return
        }

        // Bỏ qua nếu type đang là list cùng kiểu, tránh việc insertList tự remove list
        const isCurrentlyBullet = blockType === "bullet" || blockType.startsWith("bullet-")
        
        if (!isCurrentlyBullet) {
            $insertList(listType)
            // Lấy lại vùng chọn mới sau khi insertList (đồng bộ)
            const newSel = $getSelection()
            if ($isRangeSelection(newSel)) {
                // Update marker ngay trên các node list mới được tạo
                const listKeys = new Set<NodeKey>()
                const collectListKey = (node: LexicalNode) => {
                  const li = $findMatchingParent(node, $isListItemNode)
                  if (!li) return
                  const parent = li.getParent()
                  if (
                    $isListNode(parent) &&
                    parent.getListType() === listType
                  ) {
                    listKeys.add(parent.getKey())
                  }
                }
        
                collectListKey(newSel.anchor.getNode())
                collectListKey(newSel.focus.getNode())
                for (const n of newSel.getNodes()) {
                  collectListKey(n)
                }
        
                if (listKeys.size === 0) {
                  const nearestList = $findMatchingParent(newSel.anchor.getNode(), $isListNode)
                  if (
                    nearestList && $isListNode(nearestList) &&
                    nearestList.getListType() === listType
                  ) {
                    listKeys.add(nearestList.getKey())
                  }
                }
        
                for (const key of listKeys) {
                  const list = $getNodeByKey(key)
                  if ($isListNode(list) && list.getListType() === listType) {
                    if ($isListWithColorNode(list)) {
                      list.setMarkerType(markerType)
                    } else {
                      const newList = createListWithColorNodeFromRegistry(
                        activeEditor,
                        list.getListType(),
                        list.getStart(),
                        list
                      )
                      newList.setMarkerType(markerType)
                      const children = list.getChildren()
                      for (const child of children) newList.append(child)
                      list.replace(newList)
                    }
                  }
                }
            }
            return // Đã xử lý xong việc insert list và set marker mới
        }

        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return

        // Chỉ set marker trên list là cha của node nằm trong vùng chọn — tránh lệch update / nearest sai làm dính cả tài liệu
        const listKeys = new Set<NodeKey>()
        const collectListKey = (node: LexicalNode) => {
          const li = $findMatchingParent(node, $isListItemNode)
          if (!li) return
          const parent = li.getParent()
          if (
            $isListNode(parent) &&
            parent.getListType() === listType
          ) {
            listKeys.add(parent.getKey())
          }
        }

        collectListKey(sel.anchor.getNode())
        collectListKey(sel.focus.getNode())
        for (const n of sel.getNodes()) {
          collectListKey(n)
        }

        if (listKeys.size === 0) {
          const nearestList = $findMatchingParent(sel.anchor.getNode(), $isListNode)
          if (
            nearestList && $isListNode(nearestList) &&
            nearestList.getListType() === listType
          ) {
            listKeys.add(nearestList.getKey())
          }
        }

        for (const key of listKeys) {
          const list = $getNodeByKey(key)
          if ($isListNode(list) && list.getListType() === listType) {
             if ($isListWithColorNode(list)) {
               list.setMarkerType(markerType)
             } else {
               const newList = createListWithColorNodeFromRegistry(
                 activeEditor,
                 list.getListType(),
                 list.getStart(),
                 list
               )
               newList.setMarkerType(markerType)
               const children = list.getChildren()
               for (const child of children) newList.append(child)
               list.replace(newList)
             }
          }
        }
      })
    } else {
      formatParagraph()
    }
  }

  return (
    <SelectItem value={blockFormatValue} onPointerDown={formatList}>
      <Flex align="center" gap={2}>
        {blockTypeToBlockName[blockFormatValue]?.icon}
        {blockTypeToBlockName[blockFormatValue]?.label}
      </Flex>
    </SelectItem>
  )
}
