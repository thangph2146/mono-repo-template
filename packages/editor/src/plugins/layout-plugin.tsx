"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import * as React from "react"
import { JSX, useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $findMatchingParent,
  $insertNodeToNearestRoot,
  mergeRegister,
} from "@lexical/utils"
import {
  $createParagraphNode,
  $getNodeByKey,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
} from "lexical"
import type { ElementNode, LexicalCommand, LexicalNode, NodeKey } from "lexical"

import {
  $createLayoutContainerNode,
  $isLayoutContainerNode,
  LayoutContainerNode,
  INSERT_LAYOUT_COMMAND,
} from "../nodes/layout-container-node"
import {
  $createLayoutItemNode,
  $isLayoutItemNode,
  LayoutItemNode,
} from "../nodes/layout-item-node"
import { Flex } from "../ui/flex"
import { useEditorModal } from "../editor-hooks/use-modal"
import { logger } from "../lib/logger"

// Re-export dialogs and types from isolated location
export { InsertLayoutDialog } from "../editor-ui/dialogs"
export type { LayoutDialogValues as InsertLayoutDialogValues } from "../editor-ui/dialogs"

import { InsertLayoutDialog } from "../editor-ui/dialogs"
import type { LayoutDialogValues } from "../editor-ui/dialogs"

export { INSERT_LAYOUT_COMMAND }

type LayoutTargetPayload = {
  containerKey: NodeKey
  layoutItemKey: NodeKey
  values: LayoutDialogValues
}

export const UPDATE_LAYOUT_COMMAND: LexicalCommand<{
  template: string
  nodeKey: NodeKey
}> = createCommand<{ template: string; nodeKey: NodeKey }>()

export const OPEN_UPDATE_LAYOUT_MODAL_COMMAND: LexicalCommand<{
  layoutItemKey: NodeKey
}> = createCommand<{ layoutItemKey: NodeKey }>(
  "OPEN_UPDATE_LAYOUT_MODAL_COMMAND"
)

export function LayoutPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()
  const [modal, showModal] = useEditorModal()
  useEffect(() => {
    if (!editor.hasNodes([LayoutContainerNode, LayoutItemNode])) {
      throw new Error(
        "LayoutPlugin: LayoutContainerNode, or LayoutItemNode not registered on editor"
      )
    }

    const $onEscape = (before: boolean) => {
      const selection = $getSelection()
      if (
        $isRangeSelection(selection) &&
        selection.isCollapsed() &&
        selection.anchor.offset === 0
      ) {
        const container = $findMatchingParent(
          selection.anchor.getNode(),
          $isLayoutContainerNode
        )

        if (
          $isLayoutContainerNode(container) &&
          container !== undefined &&
          container !== null
        ) {
          const parent = container.getParent<ElementNode>()
          if (parent === null) {
            return false
          }
          const child = before
            ? parent.getFirstChild<LexicalNode>()
            : parent.getLastChild<LexicalNode>()
          const descendant = before
            ? container.getFirstDescendant<LexicalNode>()?.getKey()
            : container.getLastDescendant<LexicalNode>()?.getKey()

          if (child === container && selection.anchor.key === descendant) {
            if (before) {
              container.insertBefore($createParagraphNode())
            } else {
              container.insertAfter($createParagraphNode())
            }
          }
        }
      }

      return false
    }

    const extractStyleValue = (
      style: string,
      property: string
    ): string | undefined => {
      const match = style.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"))
      return match?.[1]?.trim()
    }

    const extractNumericStyle = (
      style: string,
      property: string
    ): number[] | undefined => {
      const value = extractStyleValue(style, property)
      if (!value) {
        return undefined
      }
      const values = value.trim().split(/\s+/)
      const parsedValues = values
        .map((v) => {
          const match = v.match(/^(\d+)px/i)
          if (!match?.[1]) return null
          const parsed = Number.parseInt(match[1], 10)
          return Number.isFinite(parsed) ? parsed : null
        })
        .filter((v): v is number => v !== null)

      if (parsedValues.length === 0) return undefined
      return parsedValues
    }

    const buildLayoutItemStyle = ({
      itemBackgroundColor,
      itemPaddingXPx,
      itemPaddingYPx,
      itemBorderRadiusPx,
    }: LayoutDialogValues): string => {
      const itemStyles: string[] = []
      if (itemBackgroundColor.trim()) {
        itemStyles.push(`background-color: ${itemBackgroundColor.trim()}`)
      }
      itemStyles.push(
        `padding: ${Math.min(Math.max(itemPaddingYPx, 0), 64)}px ${Math.min(
          Math.max(itemPaddingXPx, 0),
          64
        )}px`
      )
      itemStyles.push(
        `border-radius: ${Math.min(Math.max(itemBorderRadiusPx, 0), 64)}px`
      )
      return itemStyles.join("; ")
    }

    const syncLayoutItemDomStyle = (
      itemKey: NodeKey,
      values: LayoutDialogValues
    ) => {
      const element = editor.getElementByKey(itemKey)
      if (!(element instanceof HTMLElement)) {
        logger.warn("[Layout] Cannot resolve DOM element by item key", {
          itemKey,
        })
        return
      }

      const background = values.itemBackgroundColor.trim()
      const padding = `${Math.min(Math.max(values.itemPaddingYPx, 0), 64)}px ${Math.min(
        Math.max(values.itemPaddingXPx, 0),
        64
      )}px`
      const borderRadius = `${Math.min(Math.max(values.itemBorderRadiusPx, 0), 64)}px`
      if (background) {
        element.style.setProperty("background-color", background)
      }
      element.style.setProperty("padding", padding)
      element.style.setProperty("border-radius", borderRadius)

      logger.info("[Layout] Synced DOM style by key", {
        itemKey,
        domStyle: element.getAttribute("style"),
      })
    }

    const updateLayoutContainerTemplate = (
      container: LayoutContainerNode,
      template: string
    ) => {
      const itemsCount = getItemsCountFromTemplate(template)
      const prevItemsCount = getItemsCountFromTemplate(
        container.getTemplateColumns()
      )

      if (itemsCount > prevItemsCount) {
        for (let i = prevItemsCount; i < itemsCount; i++) {
          container.append(
            $createLayoutItemNode().append($createParagraphNode())
          )
        }
      } else if (itemsCount < prevItemsCount) {
        for (let i = prevItemsCount - 1; i >= itemsCount; i--) {
          const layoutItem = container.getChildAtIndex<LexicalNode>(i)
          if ($isLayoutItemNode(layoutItem)) {
            layoutItem.remove()
          }
        }
      }

      container.setTemplateColumns(template)
    }

    const getLayoutPayloadFromTarget = (
      target: HTMLElement
    ): LayoutTargetPayload | null => {
      let payload: LayoutTargetPayload | null = null

      editor.read(() => {
        const lexicalNode = $getNearestNodeFromDOMNode(target)
        if (!lexicalNode) {
          logger.warn("[Layout] Cannot resolve lexical node from DOM target")
          return
        }
        const layoutItem = $findMatchingParent(lexicalNode, (node) =>
          $isLayoutItemNode(node)
        )
        if (!$isLayoutItemNode(layoutItem)) {
          logger.warn("[Layout] Click target is not layout item node")
          return
        }
        const parentContainer = layoutItem.getParent()
        if (!$isLayoutContainerNode(parentContainer)) {
          logger.warn("[Layout] Layout item has no layout container parent")
          return
        }

        const style = layoutItem.getStyle()
        const paddingValues = extractNumericStyle(style, "padding")
        const borderRadiusValues = extractNumericStyle(style, "border-radius")

        payload = {
          containerKey: parentContainer.getKey(),
          layoutItemKey: layoutItem.getKey(),
          values: {
            template: parentContainer.getTemplateColumns(),
            itemBackgroundColor:
              extractStyleValue(style, "background-color") ?? "#ffffff",
            itemPaddingXPx: paddingValues?.[1] ?? paddingValues?.[0] ?? 12,
            itemPaddingYPx: paddingValues?.[0] ?? 12,
            itemBorderRadiusPx: borderRadiusValues?.[0] ?? 8,
          },
        }
        logger.debug("[Layout] Resolved payload from target", payload)
      })

      return payload
    }

    const openUpdateLayoutModal = (payload: LayoutTargetPayload) => {
      logger.info("[Layout] Open Update Columns Layout", payload)
      showModal("Update Columns Layout", (onClose) => (
        <Flex direction="column" gap={4}>
          <InsertLayoutDialog
            onClose={onClose}
            initialValues={payload.values}
            submitLabel="Update"
            onSubmit={(values) => {
              logger.info("[Layout] Start applying update", { payload, values })
              editor.update(() => {
                const nextStyle = buildLayoutItemStyle(values)
                logger.info("[Layout] Computed next style", { nextStyle })
                let updatedItemsCount = 0
                const container = $getNodeByKey<LexicalNode>(payload.containerKey)
                if ($isLayoutContainerNode(container)) {
                  updateLayoutContainerTemplate(container, values.template)
                  const items = container.getChildren<LexicalNode>()
                  logger.info("[Layout] Updating container items", {
                    containerKey: payload.containerKey,
                    itemsCount: items.length,
                  })
                  for (const item of items) {
                    if ($isLayoutItemNode(item)) {
                      item.setStyle(nextStyle)
                      updatedItemsCount += 1
                      logger.info("[Layout] Applied style to item", {
                        itemKey: item.getKey(),
                        appliedStyle: item.getStyle(),
                      })
                      syncLayoutItemDomStyle(item.getKey(), values)
                    }
                  }
                }

                const layoutItem = $getNodeByKey<LexicalNode>(
                  payload.layoutItemKey
                )
                if ($isLayoutItemNode(layoutItem)) {
                  layoutItem.setStyle(nextStyle)
                  logger.info("[Layout] Applied style to clicked layout item", {
                    layoutItemKey: payload.layoutItemKey,
                    appliedStyle: layoutItem.getStyle(),
                  })
                  syncLayoutItemDomStyle(layoutItem.getKey(), values)
                  logger.info("[Layout] Update summary", {
                    containerKey: payload.containerKey,
                    layoutItemKey: payload.layoutItemKey,
                    updatedItemsCount,
                  })
                  return
                }
                logger.error(
                  "[Layout] Failed to resolve container and layout item keys",
                  {
                    containerKey: payload.containerKey,
                    layoutItemKey: payload.layoutItemKey,
                  }
                )
              })
            }}
          />
        </Flex>
      ))
    }

    return mergeRegister(
      editor.registerCommand(
        OPEN_UPDATE_LAYOUT_MODAL_COMMAND,
        ({ layoutItemKey }) => {
          const element = editor.getElementByKey(layoutItemKey)
          if (element instanceof HTMLElement) {
            const layoutPayload = getLayoutPayloadFromTarget(element)
            if (layoutPayload) openUpdateLayoutModal(layoutPayload)
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => $onEscape(false),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        () => $onEscape(false),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        () => $onEscape(true),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        () => $onEscape(true),
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_LAYOUT_COMMAND,
        (payload) => {
          logger.info("[Layout] INSERT_LAYOUT_COMMAND received", { payload })
          editor.update(() => {
            const template =
              typeof payload === "string" ? payload : payload.template
            const itemBackgroundColor =
              typeof payload === "string"
                ? undefined
                : payload.itemBackgroundColor?.trim()
            const itemPaddingXPx =
              typeof payload === "string"
                ? undefined
                : typeof payload.itemPaddingXPx === "number" &&
                    Number.isFinite(payload.itemPaddingXPx)
                  ? Math.min(Math.max(payload.itemPaddingXPx, 0), 64)
                  : undefined
            const itemPaddingYPx =
              typeof payload === "string"
                ? undefined
                : typeof payload.itemPaddingYPx === "number" &&
                    Number.isFinite(payload.itemPaddingYPx)
                  ? Math.min(Math.max(payload.itemPaddingYPx, 0), 64)
                  : undefined
            const itemBorderRadiusPx =
              typeof payload === "string"
                ? undefined
                : typeof payload.itemBorderRadiusPx === "number" &&
                    Number.isFinite(payload.itemBorderRadiusPx)
                  ? Math.min(Math.max(payload.itemBorderRadiusPx, 0), 64)
                  : undefined

            const itemStyle = buildLayoutItemStyle({
              template,
              itemBackgroundColor: itemBackgroundColor ?? "#ffffff",
              itemPaddingXPx: itemPaddingXPx ?? 12,
              itemPaddingYPx: itemPaddingYPx ?? 12,
              itemBorderRadiusPx: itemBorderRadiusPx ?? 8,
            })

            const container = $createLayoutContainerNode(template)
            const itemsCount = getItemsCountFromTemplate(template)

            for (let i = 0; i < itemsCount; i++) {
              const item = $createLayoutItemNode()
              if (itemStyle) {
                item.setStyle(itemStyle)
              }
              container.append(item.append($createParagraphNode()))
            }

            $insertNodeToNearestRoot(container)
            container.selectStart()
            logger.info("[Layout] Layout container inserted successfully", {
              template,
              itemsCount,
            })
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        UPDATE_LAYOUT_COMMAND,
        ({ template, nodeKey }) => {
          editor.update(() => {
            const container = $getNodeByKey<LexicalNode>(nodeKey)

            if (!$isLayoutContainerNode(container)) {
              return
            }
            updateLayoutContainerTemplate(container, template)
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerNodeTransform(LayoutItemNode, (node) => {
        const parent = node.getParent<ElementNode>()
        if (!$isLayoutContainerNode(parent)) {
          const children = node.getChildren<LexicalNode>()
          for (const child of children) {
            node.insertBefore(child)
          }
          node.remove()
        }
      }),
      editor.registerNodeTransform(LayoutContainerNode, (node) => {
        const children = node.getChildren<LexicalNode>()
        if (!children.every($isLayoutItemNode) || children.length === 0) {
          for (const child of children) {
            node.insertBefore(child)
          }
          node.remove()
        }
      })
    )
  }, [editor, showModal])

  return <>{modal}</>
}

function getItemsCountFromTemplate(template: string): number {
  return template.trim().split(/\s+/).length
}
