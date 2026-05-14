import { ElementTransformer } from "@lexical/markdown"
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode"
import { LexicalNode } from "lexical"

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? "***" : null
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _children, _match, _isImport) => {
    const line = $createHorizontalRuleNode()

    parentNode.replace(line)

    line.selectNext()
  },
  type: "element",
}
