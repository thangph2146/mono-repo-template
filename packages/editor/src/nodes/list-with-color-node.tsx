"use client"

import type { DOMExportOutput, EditorConfig, LexicalEditor } from "lexical"
import { ListNode, type ListType, type SerializedListNode } from "@lexical/list"
import type { LexicalNode, LexicalUpdateJSON, NodeKey } from "lexical"
import { $applyNodeReplacement } from "lexical"

export type SerializedListWithColorNode = Omit<SerializedListNode, "type"> & {
  type: "listwithcolor"
  listColor?: string
  markerType?: string
}

const LIST_WITH_COLOR_TYPE = "listwithcolor"

function applyListAttributesToDom(
  dom: HTMLElement,
  color?: string,
  markerType?: string
): void {
  if (color) {
    dom.style.setProperty("--list-marker-color", color, "important")
    dom.setAttribute("data-list-color", color)
  } else {
    dom.style.removeProperty("--list-marker-color")
    dom.removeAttribute("data-list-color")
  }
  if (markerType) {
    dom.setAttribute("data-list-marker", markerType)
  } else {
    dom.removeAttribute("data-list-marker")
  }
}

export class ListWithColorNode extends ListNode {
  __listColor?: string
  __markerType?: string

  constructor(listType: ListType = "bullet", start: number = 1, key?: NodeKey) {
    super(listType, start, key)
  }

  static getType(): "listwithcolor" {
    return LIST_WITH_COLOR_TYPE
  }

  override getType(): "listwithcolor" {
    return LIST_WITH_COLOR_TYPE
  }

  static override clone(
    node: ListWithColorNode,
    key?: NodeKey
  ): ListWithColorNode {
    const listType = node.getListType()
    const start = node.getStart()
    const sameKey = key ?? node.getKey()
    const cloned = new ListWithColorNode(listType, start, sameKey)
    if (node.__listColor) cloned.__listColor = node.__listColor
    if (node.__markerType) cloned.__markerType = node.__markerType
    return cloned
  }

  static override importJSON(
    serializedNode: SerializedListWithColorNode
  ): ListWithColorNode {
    const { listType, start, listColor, markerType } = serializedNode
    const node = new ListWithColorNode(listType, start)
    if (listColor != null) node.__listColor = listColor
    if (markerType != null) node.__markerType = markerType
    return node
  }

  override afterCloneFrom(prevNode: ListWithColorNode): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lexical ListNode.afterCloneFrom(prevNode: this) không chấp nhận subtype
    super.afterCloneFrom(prevNode as any)
    this.__listColor = prevNode.__listColor
    this.__markerType = prevNode.__markerType
  }

  getListColor(): string | undefined {
    return this.getLatest().__listColor
  }

  setListColor(color: string | undefined): this {
    const writable = this.getWritable()
    writable.__listColor = color
    return this
  }

  getMarkerType(): string | undefined {
    return this.getLatest().__markerType
  }

  setMarkerType(markerType: string | undefined): this {
    const writable = this.getWritable()
    writable.__markerType = markerType
    return this
  }

  override createDOM(
    config: EditorConfig,
    _editor?: LexicalEditor
  ): HTMLElement {
    const dom = super.createDOM(config, _editor)
    applyListAttributesToDom(dom, this.__listColor, this.__markerType)
    return dom
  }

  override updateDOM(
    prevNode: ListWithColorNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Lexical ListNode.updateDOM(prevNode: this)
    const isUpdated = super.updateDOM(prevNode as any, dom, config)
    if (
      prevNode.__listColor !== this.__listColor ||
      prevNode.__markerType !== this.__markerType
    ) {
      applyListAttributesToDom(dom, this.__listColor, this.__markerType)
    }
    return isUpdated
  }

  override updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedListWithColorNode>
  ): this {
    super.updateFromJSON(serializedNode)
    const { listColor, markerType } =
      serializedNode as SerializedListWithColorNode
    if (listColor !== undefined) this.setListColor(listColor)
    if (markerType !== undefined) this.setMarkerType(markerType)
    return this
  }

  override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)
    if (output.element && output.element instanceof HTMLElement) {
      applyListAttributesToDom(
        output.element,
        this.__listColor,
        this.__markerType
      )
    }
    return output
  }

  override exportJSON(): SerializedListWithColorNode {
    const json = super.exportJSON() as SerializedListWithColorNode
    json.type = LIST_WITH_COLOR_TYPE
    if (this.__listColor) json.listColor = this.__listColor
    if (this.__markerType) json.markerType = this.__markerType
    return json
  }
}

export function $createListWithColorNode(
  listType: ListType = "bullet",
  start: number = 1
): ListWithColorNode {
  return $applyNodeReplacement(
    new ListWithColorNode(listType, start)
  ) as ListWithColorNode
}

export function $isListWithColorNode(
  node: LexicalNode | null | undefined
): node is ListWithColorNode {
  return (
    node instanceof ListWithColorNode ||
    (node != null && node.getType() === "listwithcolor")
  )
}
