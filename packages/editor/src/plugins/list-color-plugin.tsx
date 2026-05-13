"use client"

import type { JSX } from "react"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { mergeRegister } from "@lexical/utils"
import { COMMAND_PRIORITY_EDITOR, createCommand, $getNodeByKey } from "lexical"
import type { LexicalCommand, NodeKey } from "lexical"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerPresets,
} from "../editor-ui/color-picker"
import { useEditorModal } from "../editor-hooks/use-modal"
import {
  $isListWithColorNode,
} from "../nodes/list-with-color-node"
import { createListWithColorNodeFromRegistry } from "../editor-x/nodes"
import { $isListNode } from "@lexical/list"
import { Button } from "../ui/button"
import { DialogFooter } from "../ui/dialog"
import { Flex } from "../ui/flex"

export const OPEN_LIST_COLOR_PICKER_COMMAND: LexicalCommand<{
  listKey: NodeKey
}> = createCommand<{ listKey: NodeKey }>("OPEN_LIST_COLOR_PICKER_COMMAND")

const listColorStore = new Map<NodeKey, string>()

/** Patch serialized state: thêm listColor vào list nodes theo listColorStore (fallback khi load content cũ). */
export function patchListColorsInSerializedState(
  json: Record<string, unknown>
): void {
  const root = json.root as Record<string, unknown> | undefined
  if (!root || typeof root !== "object") return
  const children = root.children as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(children)) return

  function walk(nodes: Array<Record<string, unknown>>): void {
    for (const node of nodes) {
      const key = node.key as string | undefined
      const type = node.type as string | undefined
      if (type === "list" && key && listColorStore.has(key)) {
        ;(node as Record<string, unknown>).listColor = listColorStore.get(key)
      }
      const childList = node.children as Array<Record<string, unknown>> | undefined
      if (Array.isArray(childList)) walk(childList)
    }
  }
  walk(children)
}

function getListElement(element: HTMLElement): HTMLElement | null {
  const tag = element.tagName.toUpperCase()
  if (tag === "UL" || tag === "OL") return element
  const list = element.querySelector("ul, ol")
  return list instanceof HTMLElement ? list : null
}

export function ListColorPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [modal, showModal] = useEditorModal()

  React.useEffect(() => {
    const applyColor = (color: string, listKey: NodeKey) => {
      listColorStore.set(listKey, color)
      editor.update(() => {
        const node = $getNodeByKey(listKey)
        if ($isListWithColorNode(node)) {
          node.setListColor(color)
          return
        }
        if ($isListNode(node)) {
          const listType = node.getListType()
          const start = node.getStart()
          const newList = createListWithColorNodeFromRegistry(editor, listType, start, node)
          newList.setListColor(color)
          const children = node.getChildren()
          for (const c of children) newList.append(c)
          node.replace(newList)
        }
      })
    }

    return mergeRegister(
      editor.registerCommand(
        OPEN_LIST_COLOR_PICKER_COMMAND,
        ({ listKey }) => {
          const element = editor.getElementByKey(listKey)
          if (!(element instanceof HTMLElement)) return true
          const listEl = getListElement(element)
          if (!listEl) return true

          const fromStore = listColorStore.get(listKey)
          const fromVar = listEl.style.getPropertyValue("--list-marker-color")
          const fromAttr = listEl.getAttribute("data-list-color")
          const initialColor =
            fromStore || fromVar || fromAttr || "#000000"

          function ListColorModalContent({ onClose }: { onClose: () => void }) {
            const [color, setColor] = React.useState(initialColor)
            return (
              <div className="editor-list-color-dialog">
                <Flex direction="column" gap={4}>
                  <div className="editor-text-xs-muted">
                    Chọn màu cho bullet hoặc số thứ tự của list.
                  </div>
                  
                  <ColorPicker
                    inline
                    value={color}
                    onValueChange={(next) => {
                      setColor(next)
                      applyColor(next, listKey)
                    }}
                  >
                    <ColorPickerContent className="editor-w-full editor-border-0 editor-shadow-none editor-p-0">
                      <ColorPickerArea className="editor-h-40 editor-w-full editor-rounded-md" />
                      <Flex direction="column" gap={3} className="editor-mt-3">
                        <Flex direction="column" gap={2}>
                           <ColorPickerHueSlider className="editor-w-full" />
                           <ColorPickerInput className="editor-w-full" />
                        </Flex>
                        <ColorPickerPresets />
                      </Flex>
                    </ColorPickerContent>
                  </ColorPicker>

                  <DialogFooter className="editor-px-0">
                    <Button variant="outline" size="sm" onClick={onClose} className="editor-w-full">
                      Hoàn tất
                    </Button>
                  </DialogFooter>
                </Flex>
              </div>
            )
          }

          showModal("Đổi màu list", (onClose) => (
            <ListColorModalContent onClose={onClose} />
          ))
          return true
        },
        COMMAND_PRIORITY_EDITOR
      )
    )
  }, [editor, showModal])

  return <>{modal}</>
}
