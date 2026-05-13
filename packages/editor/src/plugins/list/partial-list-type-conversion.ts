import {
  $isListItemNode,
  $isListNode,
  type ListItemNode,
  type ListNode,
  type ListType,
} from "@lexical/list"
import { $findMatchingParent } from "@lexical/utils"
import type { LexicalEditor, LexicalNode, RangeSelection } from "lexical"

import { createListWithColorNodeFromRegistry } from "../../editor-x/nodes"
import { $isListWithColorNode } from "../../nodes/list-with-color-node"

/** Đồng bộ `value` từng `li` với `list.getStart()` (ordered / check). */
export function $renumberOrderedListItems(list: ListNode): void {
  let value = list.getStart()
  const isCheck = list.getListType() === "check"
  for (const child of list.getChildren()) {
    if (!$isListItemNode(child)) continue
    if (child.getValue() !== value) child.setValue(value)
    if (!isCheck && child.getLatest().__checked != null) {
      child.setChecked(undefined)
    }
    const first = child.getFirstChild()
    if (!$isListNode(first)) {
      value++
    }
  }
}

function $collectSelectedListItemsByParent(
  selection: RangeSelection
): Map<ListNode, ListItemNode[]> {
  const byKey = new Map<string, ListItemNode>()

  const add = (node: LexicalNode) => {
    const li = $findMatchingParent(node, $isListItemNode)
    if (!li || !$isListItemNode(li)) return
    const parent = li.getParent()
    if (!$isListNode(parent)) return
    byKey.set(li.getKey(), li)
  }

  add(selection.anchor.getNode())
  add(selection.focus.getNode())
  for (const n of selection.getNodes()) add(n)

  const byParent = new Map<ListNode, ListItemNode[]>()
  for (const li of byKey.values()) {
    const p = li.getParentOrThrow()
    if (!$isListNode(p)) continue
    const arr = byParent.get(p) ?? []
    arr.push(li)
    byParent.set(p, arr)
  }

  for (const [, items] of byParent) {
    items.sort((a, b) => {
      const parent = a.getParentOrThrow()
      const ch = parent.getChildren()
      return ch.findIndex((c) => c.is(a)) - ch.findIndex((c) => c.is(b))
    })
  }

  return byParent
}

function $splitNumberToBullet(
  editor: LexicalEditor,
  parentList: ListNode,
  before: ListItemNode[],
  middle: ListItemNode[],
  after: ListItemNode[],
  originalStart: number,
  maxIndexInOriginal: number,
  markerType: string | undefined
): void {
  const listColor = $isListWithColorNode(parentList) ? parentList.getListColor() : undefined
  const numberMarker = $isListWithColorNode(parentList) ? parentList.getMarkerType() : undefined

  const newBullet = createListWithColorNodeFromRegistry(editor, "bullet", 1, parentList)
  if (listColor) newBullet.setListColor(listColor)
  if (markerType !== undefined) newBullet.setMarkerType(markerType)

  for (const li of middle) {
    newBullet.append(li)
  }

  if (before.length > 0 && after.length > 0) {
    const newAfterOl = createListWithColorNodeFromRegistry(
      editor,
      "number",
      originalStart + maxIndexInOriginal + 1,
      parentList
    )
    if (listColor) newAfterOl.setListColor(listColor)
    if (numberMarker !== undefined) newAfterOl.setMarkerType(numberMarker)
    for (const li of after) {
      newAfterOl.append(li)
    }
    parentList.insertAfter(newBullet)
    newBullet.insertAfter(newAfterOl)
    $renumberOrderedListItems(parentList)
    $renumberOrderedListItems(newAfterOl)
  } else if (after.length > 0 && before.length === 0) {
    parentList.insertBefore(newBullet)
    parentList.setStart(originalStart + maxIndexInOriginal + 1)
    $renumberOrderedListItems(parentList)
  } else {
    parentList.insertAfter(newBullet)
    $renumberOrderedListItems(parentList)
  }
}

function $splitBulletToNumber(
  editor: LexicalEditor,
  parentList: ListNode,
  before: ListItemNode[],
  middle: ListItemNode[],
  after: ListItemNode[]
): void {
  const listColor = $isListWithColorNode(parentList) ? parentList.getListColor() : undefined
  const bulletMarker = $isListWithColorNode(parentList) ? parentList.getMarkerType() : undefined

  const newNumber = createListWithColorNodeFromRegistry(editor, "number", 1, parentList)
  if (listColor) newNumber.setListColor(listColor)
  newNumber.setMarkerType(undefined)

  for (const li of middle) {
    newNumber.append(li)
  }

  if (before.length > 0 && after.length > 0) {
    const newAfterUl = createListWithColorNodeFromRegistry(editor, "bullet", 1, parentList)
    if (listColor) newAfterUl.setListColor(listColor)
    if (bulletMarker !== undefined) newAfterUl.setMarkerType(bulletMarker)
    for (const li of after) {
      newAfterUl.append(li)
    }
    parentList.insertAfter(newNumber)
    newNumber.insertAfter(newAfterUl)
  } else if (after.length > 0 && before.length === 0) {
    parentList.insertBefore(newNumber)
  } else {
    parentList.insertAfter(newNumber)
  }

  $renumberOrderedListItems(newNumber)
}

/**
 * Lexical `$insertList` / INSERT_*_LIST thay cả `ListNode` khi vùng chọn chỉ gồm một phần `li`.
 * Hàm này tách list tại biên vùng chọn (một dải `li` liên tiếp) rồi chỉ đổi kiểu phần giữa.
 *
 * @returns `true` nếu đã xử lý (không cần dispatch INSERT_*).
 */
export function $tryPartialListTypeConversion(
  editor: LexicalEditor,
  selection: RangeSelection,
  targetListType: ListType,
  options?: { markerType?: string }
): boolean {
  const byParent = $collectSelectedListItemsByParent(selection)
  if (byParent.size !== 1) return false

  const entry = [...byParent.entries()][0]
  if (!entry) return false
  const [parentList, selectedItems] = entry
  const sourceType = parentList.getListType()

  if (sourceType === targetListType) return false
  if (sourceType === "check" || targetListType === "check") return false

  const allItems = parentList
    .getChildren()
    .filter((c): c is ListItemNode => $isListItemNode(c))

  if (allItems.length <= 1) return false

  const indices = selectedItems
    .map((li) => allItems.findIndex((c) => c.is(li)))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b)

  const unique = [...new Set(indices)]
  if (unique.length === 0) return false
  if (unique.length === allItems.length) return false

  const minI = unique[0]!
  const maxI = unique[unique.length - 1]!
  if (maxI - minI + 1 !== unique.length) return false

  const before = allItems.slice(0, minI)
  const middle = allItems.slice(minI, maxI + 1)
  const after = allItems.slice(maxI + 1)

  if (targetListType === "bullet" && sourceType === "number") {
    $splitNumberToBullet(
      editor,
      parentList,
      before,
      middle,
      after,
      parentList.getStart(),
      maxI,
      options?.markerType
    )
    return true
  }

  if (targetListType === "number" && sourceType === "bullet") {
    $splitBulletToNumber(editor, parentList, before, middle, after)
    return true
  }

  return false
}
