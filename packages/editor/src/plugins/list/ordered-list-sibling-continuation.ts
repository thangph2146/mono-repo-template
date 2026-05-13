import { $isListItemNode, $isListNode, type ListNode } from "@lexical/list"
import { $isHeadingNode } from "@lexical/rich-text"
import {
  $getRoot,
  $isElementNode,
  type ElementNode,
  type LexicalNode,
} from "lexical"

import {
  LIST_CONTINUE_NUMBERING_ACROSS_INTERRUPTS,
  LIST_ORDERED_NUMBERING_RESET_AT_HEADING,
} from "../../config/editor-list-config"
import { $renumberOrderedListItems } from "./partial-list-type-conversion"

/** Số `li` trực tiếp của một ordered list (dùng để tính `start` cho list kế tiếp). */
export function $countDirectOrderedListItems(list: ListNode): number {
  if (list.getListType() !== "number") return 0
  let n = 0
  for (const c of list.getChildren()) {
    if ($isListItemNode(c)) {
      const first = c.getFirstChild()
      if (!$isListNode(first)) n++
    }
  }
  return n
}

/**
 * Gán lại `start` cho các `ol` (number) cùng parent.
 *
 * - `LIST_CONTINUE_NUMBERING_ACROSS_INTERRUPTS`: đoạn văn / bullet / quote giữa các `ol` không làm mất nối số.
 * - `LIST_ORDERED_NUMBERING_RESET_AT_HEADING`: heading bắt đầu chuỗi mới từ 1 (khi chế độ interrupt bật).
 *
 * Gọi trong `editor.update`.
 */
export function $reconcileOrderedListStartsInParent(parent: ElementNode): boolean {
  let changed = false
  let nextStart = 1
  for (const child of parent.getChildren()) {
    if (LIST_CONTINUE_NUMBERING_ACROSS_INTERRUPTS) {
      if (
        LIST_ORDERED_NUMBERING_RESET_AT_HEADING &&
        $isHeadingNode(child)
      ) {
        nextStart = 1
        continue
      }
      if ($isListNode(child) && child.getListType() === "number") {
        const itemCount = $countDirectOrderedListItems(child)
        if (child.getStart() !== nextStart) {
          child.setStart(nextStart)
          changed = true
        }
        $renumberOrderedListItems(child)
        nextStart += itemCount
      }
      continue
    }

    if ($isListNode(child) && child.getListType() === "number") {
      const itemCount = $countDirectOrderedListItems(child)
      if (child.getStart() !== nextStart) {
        child.setStart(nextStart)
        changed = true
      }
      $renumberOrderedListItems(child)
      nextStart += itemCount
    } else {
      nextStart = 1
    }
  }
  return changed
}

/** Duyệt cây, mỗi element có ít nhất một `ol` con trực tiếp thì reconcile một lần. */
export function $reconcileAllOrderedListSiblingGroups(root: LexicalNode = $getRoot()): void {
  if (!$isElementNode(root)) return
  const stack: ElementNode[] = [root]
  while (stack.length > 0) {
    const el = stack.pop()!
    for (const c of el.getChildren()) {
      if ($isElementNode(c)) stack.push(c)
    }
    let hasOrderedListChild = false
    for (const c of el.getChildren()) {
      if ($isListNode(c) && c.getListType() === "number") {
        hasOrderedListChild = true
        break
      }
    }
    if (hasOrderedListChild) {
      $reconcileOrderedListStartsInParent(el)
    }
  }
}
