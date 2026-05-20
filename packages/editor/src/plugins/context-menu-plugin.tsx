import type { JSX } from "react"
import { useCallback, useMemo } from "react"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  NodeContextMenuOption,
  NodeContextMenuPlugin,
  NodeContextMenuSeparator,
} from "@lexical/react/LexicalNodeContextMenuPlugin"
import {
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  $isRangeSelection,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND,
} from "lexical"
import {
  Clipboard,
  ClipboardType,
  Copy,
  Link2Off,
  Scissors,
  Settings2,
  Trash2,
} from "lucide-react"
import { IconSize } from "../ui/typography"
import { $isLayoutItemNode } from "../nodes/layout-item-node"
import { OPEN_UPDATE_LAYOUT_MODAL_COMMAND } from "./layout-plugin"

export function ContextMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const syncContextMenuLayer = useCallback((node: HTMLElement | null) => {
    if (!node) return

    // Ensure Floating UI overlay/portal always stays above sticky admin action bars.
    const overlayNode = node.parentElement as HTMLElement | null
    if (overlayNode) {
      overlayNode.style.zIndex = "1320"
    }

    const portalNode = node.closest(
      "[data-floating-ui-portal]"
    ) as HTMLElement | null
    if (portalNode) {
      portalNode.style.zIndex = "1320"
    }
  }, [])

  const items = useMemo(() => {
    return [
      new NodeContextMenuOption(`Edit Layout`, {
        $onSelect: () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const currentNode = selection.anchor.getNode()
            const layoutItem = currentNode.getParents().find($isLayoutItemNode)
            if (layoutItem) {
              editor.dispatchCommand(OPEN_UPDATE_LAYOUT_MODAL_COMMAND, {
                layoutItemKey: layoutItem.getKey(),
              })
            }
          }
        },
        $showOn: (node) => {
          const layoutItem = node.getParents().find($isLayoutItemNode)
          return !!layoutItem
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Settings2 />
          </IconSize>
        ),
      }),
      new NodeContextMenuSeparator({
        $showOn: (node) => {
          const layoutItem = node.getParents().find($isLayoutItemNode)
          return !!layoutItem
        },
      }),
      new NodeContextMenuOption(`Remove Link`, {
        $onSelect: () => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
        },
        $showOn: (node) => $isLinkNode(node.getParent()),
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Link2Off />
          </IconSize>
        ),
      }),
      new NodeContextMenuSeparator({
        $showOn: (node) => $isLinkNode(node.getParent()),
      }),
      new NodeContextMenuOption(`Cut`, {
        $onSelect: () => {
          editor.dispatchCommand(CUT_COMMAND, null)
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Scissors />
          </IconSize>
        ),
      }),
      new NodeContextMenuOption(`Copy`, {
        $onSelect: () => {
          editor.dispatchCommand(COPY_COMMAND, null)
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Copy />
          </IconSize>
        ),
      }),
      new NodeContextMenuOption(`Paste`, {
        $onSelect: () => {
          navigator.clipboard.read().then(async function (...args) {
            void args
            const data = new DataTransfer()

            const readClipboardItems = await navigator.clipboard.read()
            const item = readClipboardItems[0]
            if (!item) return

            const permission = await navigator.permissions.query({
              name: "clipboard-read" as PermissionName,
            })
            if (permission.state === "denied") {
              alert("Not allowed to paste from clipboard.")
              return
            }

            for (const type of item.types) {
              const dataString = await (await item.getType(type)).text()
              data.setData(type, dataString)
            }

            const event = new ClipboardEvent("paste", {
              clipboardData: data,
            })

            editor.dispatchCommand(PASTE_COMMAND, event)
          })
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Clipboard />
          </IconSize>
        ),
      }),
      new NodeContextMenuOption(`Paste as Plain Text`, {
        $onSelect: () => {
          navigator.clipboard.read().then(async function (...args) {
            void args
            const permission = await navigator.permissions.query({
              name: "clipboard-read" as PermissionName,
            })

            if (permission.state === "denied") {
              alert("Not allowed to paste from clipboard.")
              return
            }

            const data = new DataTransfer()
            const clipboardText = await navigator.clipboard.readText()
            data.setData("text/plain", clipboardText)

            const event = new ClipboardEvent("paste", {
              clipboardData: data,
            })
            editor.dispatchCommand(PASTE_COMMAND, event)
          })
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <ClipboardType />
          </IconSize>
        ),
      }),
      new NodeContextMenuSeparator(),
      new NodeContextMenuOption(`Delete Node`, {
        $onSelect: () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            const currentNode = selection.anchor.getNode()
            const ancestorNodeWithRootAsParent = currentNode.getParents().at(-2)

            ancestorNodeWithRootAsParent?.remove()
          } else if ($isNodeSelection(selection)) {
            const selectedNodes = selection.getNodes()
            selectedNodes.forEach((node) => {
              if ($isDecoratorNode(node)) {
                node.remove()
              }
            })
          }
        },
        disabled: false,
        icon: (
          <IconSize size="sm">
            <Trash2 />
          </IconSize>
        ),
      }),
    ]
  }, [editor])

  return (
    <NodeContextMenuPlugin
      ref={(node) =>
        syncContextMenuLayer(node as unknown as HTMLElement | null)
      }
      className="editor-context-menu"
      itemClassName="editor-context-menu-item"
      separatorClassName="editor-context-menu-separator"
      items={items}
    />
  )
}
