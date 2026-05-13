import { $findMatchingParent } from "@lexical/utils"
import type { LexicalEditor, LexicalNode } from "lexical"
import { $isListNode, ListNode } from "@lexical/list"

import { createListWithColorNodeFromRegistry } from "../../editor-x/nodes"
import {
  $createListWithColorNode,
  $isListWithColorNode,
} from "../../nodes/list-with-color-node"

/** Gọi bên trong `editor.update`. */
export function $applyNumberListMarkerFromAnchor(
  editor: LexicalEditor,
  anchorNode: LexicalNode | null,
  markerType: string | undefined
): void {
  if (!anchorNode) return
  const nearestListNode = $findMatchingParent(
    anchorNode,
    (node): node is ListNode => $isListNode(node) && node.getListType() === "number"
  )
  if (!nearestListNode) return
  let listNode: ListNode = nearestListNode
  let parent = listNode.getParent()
  while (parent) {
    if ($isListNode(parent) && parent.getListType() === "number") {
      listNode = parent
      parent = parent.getParent()
      continue
    }
    break
  }
  if ($isListWithColorNode(listNode)) {
    listNode.setMarkerType(markerType)
    return
  }
  const newList = createListWithColorNodeFromRegistry(
    editor,
    listNode.getListType(),
    listNode.getStart(),
    listNode
  )
  newList.setMarkerType(markerType)
  const children = listNode.getChildren()
  for (const child of children) newList.append(child)
  listNode.replace(newList)
}

/** Gọi bên trong `editor.update`. */
export function $applyBulletListMarkerFromAnchor(
  editor: LexicalEditor,
  anchorNode: LexicalNode | null,
  markerType: string | undefined
): void {
  if (!anchorNode) return
  const nearestListNode = $findMatchingParent(
    anchorNode,
    (node): node is ListNode => $isListNode(node) && node.getListType() === "bullet"
  )
  if (!nearestListNode) return
  let listNode: ListNode = nearestListNode
  let parent = listNode.getParent()
  while (parent) {
    if ($isListNode(parent) && parent.getListType() === "bullet") {
      listNode = parent
      parent = parent.getParent()
      continue
    }
    break
  }
  if ($isListWithColorNode(listNode)) {
    listNode.setMarkerType(markerType)
    return
  }
  const newList = createListWithColorNodeFromRegistry(
    editor,
    listNode.getListType(),
    listNode.getStart(),
    listNode
  )
  newList.setMarkerType(markerType)
  const children = listNode.getChildren()
  for (const child of children) newList.append(child)
  listNode.replace(newList)
}

/** Gọi bên trong `editor.update`. */
export function $syncNumberListMarkerToSiblingLists(
  targetListNode: ListNode,
  markerType: string | undefined
): void {
  const parent = targetListNode.getParent()
  if (!parent) return
  for (const sibling of parent.getChildren()) {
    if ($isListNode(sibling) && sibling.getListType() === "number" && sibling !== targetListNode) {
      if ($isListWithColorNode(sibling)) {
        sibling.setMarkerType(markerType)
      } else {
        const newList = $createListWithColorNode("number", sibling.getStart())
        newList.setMarkerType(markerType)
        const children = sibling.getChildren()
        for (const child of children) newList.append(child)
        sibling.replace(newList)
      }
    }
  }
}
