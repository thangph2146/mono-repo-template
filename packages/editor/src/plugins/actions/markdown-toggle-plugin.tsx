"use client"

import { useCallback } from "react"
import { $createCodeNode, $isCodeNode } from "@lexical/code"
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  Transformer,
} from "@lexical/markdown"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $createTextNode, $getRoot } from "lexical"
import { FileTextIcon } from "lucide-react"

import { Button } from "../../ui/button"
import { IconSize } from "../../ui/typography"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip"

export function MarkdownTogglePlugin({
  shouldPreserveNewLinesInMarkdown,
  transformers,
}: {
  shouldPreserveNewLinesInMarkdown: boolean
  transformers: Array<Transformer>
}) {
  const [editor] = useLexicalComposerContext()

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot()
      const firstChild = root.getFirstChild()
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === "markdown") {
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          transformers,
          undefined, // node
          shouldPreserveNewLinesInMarkdown
        )
      } else {
        const markdown = $convertToMarkdownString(
          transformers,
          undefined, //node
          shouldPreserveNewLinesInMarkdown
        )
        const codeNode = $createCodeNode("markdown")
        codeNode.append($createTextNode(markdown))
        root.clear().append(codeNode)
        if (markdown.length === 0) {
          codeNode.select()
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, shouldPreserveNewLinesInMarkdown])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={"ghost"}
          onClick={handleMarkdownToggle}
          title="Convert From Markdown"
          aria-label="Convert from markdown"
          size={"sm"}
          className="editor-p-2"
        >
          <IconSize size="sm">
            <FileTextIcon />
          </IconSize>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Markdown Mode</TooltipContent>
    </Tooltip>
  )
}
