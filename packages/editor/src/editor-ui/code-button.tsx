import * as React from "react"
import { useState } from "react"
import { $isCodeNode } from "@lexical/code"
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
  LexicalEditor,
} from "lexical"
import { CircleCheckIcon, CopyIcon } from "lucide-react"
import { logger } from "../lib/logger"

import { useDebounce } from "../editor-hooks/use-debounce"
import { IconSize } from "../ui/typography"

interface Props {
  editor: LexicalEditor
  getCodeDOMNode: () => HTMLElement | null
}

export function CopyButton({ editor, getCodeDOMNode }: Props) {
  const [isCopyCompleted, setCopyCompleted] = useState<boolean>(false)

  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false)
  }, 1000)

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode()

    if (!codeDOMNode) {
      return
    }

    let content = ""

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode)

      if ($isCodeNode(codeNode)) {
        content = codeNode.getTextContent()
      }

      const selection = $getSelection()
      $setSelection(selection)
    })

    try {
      await navigator.clipboard.writeText(content)
      setCopyCompleted(true)
      removeSuccessIcon()
    } catch (err) {
      logger.error("Failed to copy: ", err)
    }
  }

  return (
    <button
      type="button"
      className="editor-btn editor-text-foreground-50 editor-flex editor-shrink-0 editor-cursor-pointer editor-items-center editor-rounded-md editor-border editor-border-transparent editor-bg-none editor-p-1 editor-uppercase editor-transition-colors"
      onClick={handleClick}
      aria-label="copy"
    >
      {isCopyCompleted ? (
        <IconSize size="sm">
          <CircleCheckIcon />
        </IconSize>
      ) : (
        <IconSize size="sm">
          <CopyIcon />
        </IconSize>
      )}
    </button>
  )
}
