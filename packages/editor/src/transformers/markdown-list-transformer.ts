import {
  $createListItemNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list"
import { ElementTransformer } from "@lexical/markdown"

import {
  $createListWithColorNode,
  $isListWithColorNode,
  ListWithColorNode,
} from "../nodes/list-with-color-node"

export const UNORDERED_LIST: ElementTransformer = {
  dependencies: [ListWithColorNode, ListNode, ListItemNode],
  export: (node) => {
    if (!$isListNode(node) || node.getListType() !== "bullet") {
      return null
    }
    const marker = $isListWithColorNode(node)
      ? node.getMarkerType() || "-"
      : "-"
    const children = node.getChildren()
    const output = []
    for (const child of children) {
      if ($isListItemNode(child)) {
        output.push(`${marker} ${child.getTextContent()}`)
      }
    }
    return output.join("\n")
  },
  regExp: /^(\s*)([*+-])\s/,
  replace: (parentNode, _children, match, _isImport) => {
    const marker = match[2]
    const list = $createListWithColorNode("bullet")

    if (marker === "-" || marker === "+") {
      list.setMarkerType(marker)
    }

    parentNode.replace(list)

    const item = $createListItemNode()
    list.append(item)
    item.append(..._children)
    if (_children.length === 0) {
      item.select()
    } else {
      item.selectEnd()
    }
  },
  type: "element",
}
