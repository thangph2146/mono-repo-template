"use client"

import { type CSSProperties, type ReactNode, useEffect, useState } from "react"
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { $findMatchingParent } from "@lexical/utils"
import { $isListNode } from "@lexical/list"
import { $isCodeNode } from "@lexical/code"
import { $isHeadingNode } from "@lexical/rich-text"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"

import { ToolbarContext } from "../../context/toolbar-context"
import { useEditorModal } from "../../editor-hooks/use-modal"
import { useHeaderHeight } from "../../hooks/use-header-height"
import { cn } from "../../lib/utils"
import { blockTypeToBlockName } from "../../plugins/toolbar/block-format/block-format-data"

export function ToolbarPlugin({
  children,
  className,
  style,
  stickyTop,
}: {
  children: (props: { blockType: string }) => ReactNode
  className?: string
  style?: CSSProperties
  stickyTop?: number
}) {
  const [editor] = useLexicalComposerContext()
  const { headerHeight } = useHeaderHeight()

  const [activeEditor, setActiveEditor] = useState(editor)
  const [blockType, setBlockType] = useState<string>("paragraph")

  const [modal, showModal] = useEditorModal()

  const $updateToolbar = () => {}

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor)

        // Detect block type from selection
        newEditor.getEditorState().read(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            try {
              const anchorNode = selection.anchor.getNode()
              let element =
                anchorNode.getKey() === "root"
                  ? anchorNode
                  : $findMatchingParent(anchorNode, (e) => {
                      const parent = e.getParent()
                      return parent !== null && $isRootOrShadowRoot(parent)
                    })

              if (element === null) {
                try {
                  element = anchorNode.getTopLevelElementOrThrow()
                } catch {
                  setBlockType("paragraph")
                  return false
                }
              }

              const elementType = element.getType()

              // Check block type
              if ($isListNode(element)) {
                setBlockType(elementType)
              } else if ($isCodeNode(element)) {
                setBlockType("code")
              } else if ($isHeadingNode(element)) {
                setBlockType(element.getTag())
              } else if (elementType in blockTypeToBlockName) {
                setBlockType(elementType)
              } else {
                setBlockType("paragraph")
              }
            } catch {
              setBlockType("paragraph")
            }
          }
        })

        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor])

  return (
    <ToolbarContext
      activeEditor={activeEditor}
      $updateToolbar={$updateToolbar}
      blockType={blockType}
      setBlockType={setBlockType}
      showModal={showModal}
    >
      {modal}

      <div
        className={cn("editor-toolbar", className)}
        style={{
          ...style,
          top: stickyTop ?? Math.round(headerHeight),
        }}
      >
        {children({ blockType })}
      </div>
    </ToolbarContext>
  )
}
