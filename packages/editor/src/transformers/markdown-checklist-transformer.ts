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

export const CHECK_LIST: ElementTransformer = {
  dependencies: [ListWithColorNode, ListNode, ListItemNode],
  export: (node) => {
    if (!$isListNode(node) || node.getListType() !== "check") {
      return null
    }
    const children = node.getChildren()
    const output = []
    for (const child of children) {
      if ($isListItemNode(child)) {
        const checked = child.getChecked()
        const marker = checked ? "[x]" : "[ ]"
        output.push(`- ${marker} ${child.getTextContent()}`)
      }
    }
    return output.join("\n")
  },
  regExp: /^(\s*)-\s\[([ xX])\]\s/,
  replace: (parentNode, _children, match, _isImport) => {
    const checked = match[2] !== " "
    const list = $createListWithColorNode("check")
    parentNode.replace(list)

    const item = $createListItemNode(checked)
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
