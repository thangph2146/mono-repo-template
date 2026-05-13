"use client"

import { useState } from "react"
import { $isTableSelection } from "@lexical/table"
import { $isRangeSelection, BaseSelection, FORMAT_TEXT_COMMAND } from "lexical"
import { SubscriptIcon, SuperscriptIcon } from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { Button } from "../../ui/button"
import { IconSize } from "../../ui/typography"

export function SubSuperToolbarPlugin() {
  const { activeEditor } = useToolbarContext()
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsSubscript((selection as any).hasFormat("subscript"))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setIsSuperscript((selection as any).hasFormat("superscript"))
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle subscript"
        data-state={isSubscript ? "on" : "off"}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
        }}
        className="editor-toolbar-item"
      >
        <IconSize size="sm">
          <SubscriptIcon />
        </IconSize>
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle superscript"
        data-state={isSuperscript ? "on" : "off"}
        onClick={() => {
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
        }}
        className="editor-toolbar-item"
      >
        <IconSize size="sm">
          <SuperscriptIcon />
        </IconSize>
      </Button>
    </>
  )
}
