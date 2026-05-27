import type { EditorConfig, LexicalNode, NodeKey } from "lexical"
import type { LinkAttributes, SerializedLinkNode } from "@lexical/link"
import { LinkNode } from "@lexical/link"

// NOTE:
// Lexical's `LinkNode` doesn't support the HTML `download` attribute.
// This custom node adds `download` so file links can trigger browser download.

export type SerializedDownloadLinkNode = SerializedLinkNode & {
  download: string | null
  type: "download-link"
  version: 1
}

export class DownloadLinkNode extends LinkNode {
  __download: string | null

  static getType(): string {
    return "download-link"
  }

  static clone(node: DownloadLinkNode): DownloadLinkNode {
    return new DownloadLinkNode(
      node.getURL(),
      node.__download,
      {
        rel: node.getRel(),
        target: node.getTarget(),
        title: node.getTitle(),
      },
      node.__key
    )
  }

  constructor(
    url?: string,
    download: string | null = null,
    attributes?: LinkAttributes,
    key?: NodeKey
  ) {
    super(url, attributes, key)
    this.__download = download
  }

  getDownload(): string | null {
    return this.__download
  }

  setDownload(download: string | null): this {
    const writable = this.getWritable()
    writable.__download = download
    return this
  }

  override createDOM(
    config: EditorConfig
  ): HTMLAnchorElement | HTMLSpanElement {
    const dom = super.createDOM(config)
    this.applyDownloadDOM(dom)
    return dom
  }

  override updateLinkDOM(
    prevNode: this | null,
    anchorElem: HTMLAnchorElement | HTMLSpanElement,
    config: EditorConfig
  ): void {
    super.updateLinkDOM(prevNode, anchorElem, config)
    this.applyDownloadDOM(anchorElem)
  }

  override exportJSON(): SerializedDownloadLinkNode {
    return {
      ...(super.exportJSON() as unknown as SerializedLinkNode),
      type: DownloadLinkNode.getType() as "download-link",
      version: 1,
      download: this.__download,
    } as SerializedDownloadLinkNode
  }

  static override importJSON(
    serializedNode: SerializedDownloadLinkNode
  ): DownloadLinkNode {
    const node = new DownloadLinkNode(
      serializedNode.url,
      serializedNode.download,
      {
        rel: serializedNode.rel ?? null,
        target: serializedNode.target ?? null,
        title: serializedNode.title ?? null,
      },
      (serializedNode as unknown as { key?: NodeKey }).key
    )
    return node
  }

  private applyDownloadDOM(dom: HTMLAnchorElement | HTMLSpanElement): void {
    // `download` attribute only applies to <a>.
    if (dom instanceof HTMLAnchorElement) {
      if (this.__download === null) {
        dom.removeAttribute("download")
      } else {
        dom.setAttribute("download", this.__download)
      }
    }
  }
}

export function $createDownloadLinkNode(
  url?: string,
  download: string | null = null,
  attributes?: LinkAttributes
): DownloadLinkNode {
  return new DownloadLinkNode(url, download, attributes)
}

export function $isDownloadLinkNode(
  node: LexicalNode | null | undefined
): node is DownloadLinkNode {
  return node instanceof DownloadLinkNode
}
