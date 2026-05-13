import { addClassNamesToElement } from "@lexical/utils"
import type {
  DOMConversionMap,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
} from "lexical"
import { ElementNode } from "lexical"

export type SerializedLayoutItemNode = SerializedElementNode & {
  style?: string
}

function withPaddingFallback(style: string): string {
  const normalizedStyle = style.trim()
  if (/padding\s*:/i.test(normalizedStyle)) {
    return normalizedStyle
  }
  if (!normalizedStyle) {
    return "padding: 12px;"
  }
  return `${normalizedStyle.replace(/;?$/, ";")} padding: 12px;`
}

function applyLayoutItemStyle(dom: HTMLElement, style: string): void {
  dom.style.cssText = style
  const padding = dom.style.padding || "12px"
  dom.style.setProperty("padding", padding, "important")
}

function applyLayoutItemAttributes(dom: HTMLElement): void {
  dom.setAttribute("data-lexical-layout-item", "true")
}

function getLayoutItemThemeClass(config: EditorConfig): string {
  return typeof config.theme.layoutItem === "string"
    ? config.theme.layoutItem
    : "border border-dashed"
}

export class LayoutItemNode extends ElementNode {
  static getType(): string {
    return "layout-item"
  }

  static clone(node: LayoutItemNode): LayoutItemNode {
    return new LayoutItemNode(node.__key)
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement("div")
    addClassNamesToElement(dom, getLayoutItemThemeClass(config))
    applyLayoutItemAttributes(dom)
    applyLayoutItemStyle(dom, withPaddingFallback(this.getStyle()))
    return dom
  }

  updateDOM(prevNode: LayoutItemNode, dom: HTMLElement, config: EditorConfig): boolean {
    const expectedClass = getLayoutItemThemeClass(config)
    if (dom.className !== expectedClass) {
      dom.className = ""
      addClassNamesToElement(dom, expectedClass)
    }
    applyLayoutItemAttributes(dom)

    const prevStyle = withPaddingFallback(prevNode.getStyle())
    const nextStyle = withPaddingFallback(this.getStyle())
    if (prevStyle !== nextStyle) {
      applyLayoutItemStyle(dom, nextStyle)
    }
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {}
  }

  static importJSON(json: SerializedLayoutItemNode): LayoutItemNode {
    const node = $createLayoutItemNode()
    if (json.format) {
      node.setFormat(json.format)
    }
    if (json.indent) {
      node.setIndent(json.indent)
    }
    if ("direction" in json && json.direction !== null) {
      node.setDirection(json.direction)
    }
    if ("style" in json && typeof json.style === "string") {
      node.setStyle(json.style)
    }
    return node
  }

  isShadowRoot(): boolean {
    return true
  }

  exportJSON(): SerializedLayoutItemNode {
    const style = this.getStyle()
    return {
      ...super.exportJSON(),
      ...(style ? { style } : {}),
      type: "layout-item",
      version: 1,
    }
  }
}

export function $createLayoutItemNode(): LayoutItemNode {
  return new LayoutItemNode()
}

export function $isLayoutItemNode(
  node: LexicalNode | null | undefined
): node is LayoutItemNode {
  return node instanceof LayoutItemNode
}
