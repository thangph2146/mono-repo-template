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
  ListWithColorNode,
} from "../nodes/list-with-color-node"

export const ORDERED_LIST: ElementTransformer = {
  dependencies: [ListWithColorNode, ListNode, ListItemNode],
  export: (node) => {
    if (!$isListNode(node) || node.getListType() !== "number") {
      return null
    }
    const children = node.getChildren()
    const output = []
    for (const child of children) {
      if ($isListItemNode(child)) {
        output.push(`1. ${child.getTextContent()}`)
      }
    }
    return output.join("\n")
  },
  regExp: /^(\s*)(\d{1,})\.\s/,
  replace: (parentNode, _children, _match, _isImport) => {
    const list = $createListWithColorNode("number")
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
