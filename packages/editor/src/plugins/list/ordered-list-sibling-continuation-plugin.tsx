"use client"

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $isListItemNode, $isListNode } from "@lexical/list"
import { $findMatchingParent } from "@lexical/utils"
import { useEffect } from "react"
import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  type NodeKey,
} from "lexical"

import { LIST_CONTINUE_NUMBERING_ACROSS_SIBLING_OLS } from "../../config/editor-list-config"
import {
  $reconcileAllOrderedListSiblingGroups,
  $reconcileOrderedListStartsInParent,
} from "./ordered-list-sibling-continuation"

const RECONCILE_TAG = "editor-ordered-list-sibling-reconcile"

/** Từ bất kỳ node dirty nào, tìm element parent chứa các `ol` number cùng cấp cần reconcile. */
function $parentElementKeyForOrderedListContext(nodeKey: NodeKey): NodeKey | null {
  const n = $getNodeByKey(nodeKey)
  if (!n) return null
  if ($isListNode(n) && n.getListType() === "number") {
    const p = n.getParent()
    return $isElementNode(p) ? p.getKey() : null
  }
  const li = $findMatchingParent(n, $isListItemNode)
  if (li && $isListItemNode(li)) {
    const list = li.getParent()
    if ($isListNode(list) && list.getListType() === "number") {
      const p = list.getParent()
      return $isElementNode(p) ? p.getKey() : null
    }
  }
  return null
}

/**
 * Đồng bộ `start` cho nhiều thẻ `ol` (number) cùng parent — kể cả mỗi lần chọn tạo một `ol` riêng.
 * Dùng `registerUpdateListener` (ổn định hơn chỉ mutation) + microtask gom parent.
 * Xem `LIST_CONTINUE_NUMBERING_ACROSS_INTERRUPTS` / `LIST_ORDERED_NUMBERING_RESET_AT_HEADING` trong `editor-list-config`.
 */
export function OrderedListSiblingContinuationPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!LIST_CONTINUE_NUMBERING_ACROSS_SIBLING_OLS) return

    let microQueued = false
    const pendingParents = new Set<NodeKey>()

    const flush = () => {
      microQueued = false
      const keys = [...pendingParents]
      pendingParents.clear()

      editor.update(
        () => {
          for (const k of keys) {
            const p = $getNodeByKey(k)
            if ($isElementNode(p)) {
              $reconcileOrderedListStartsInParent(p)
            }
          }
        },
        { tag: RECONCILE_TAG }
      )
    }

    const schedule = () => {
      if (microQueued) return
      microQueued = true
      queueMicrotask(flush)
    }

    const unUpdate = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves, tags }) => {
        if (tags.has(RECONCILE_TAG)) return

        let touched = false

        editor.getEditorState().read(() => {
          const rootKey = $getRoot().getKey()
          if (dirtyElements.has(rootKey)) {
            pendingParents.add(rootKey)
            touched = true
          }

          for (const k of dirtyElements.keys()) {
            const pk = $parentElementKeyForOrderedListContext(k)
            if (pk) {
              pendingParents.add(pk)
              touched = true
            }
          }
          for (const k of dirtyLeaves) {
            const pk = $parentElementKeyForOrderedListContext(k)
            if (pk) {
              pendingParents.add(pk)
              touched = true
            }
          }
        })

        if (touched) schedule()
      }
    )

    queueMicrotask(() => {
      editor.update(
        () => {
          $reconcileAllOrderedListSiblingGroups()
        },
        { tag: RECONCILE_TAG }
      )
    })

    return () => {
      unUpdate()
    }
  }, [editor])

  return null
}
