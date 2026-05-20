"use client"

import { useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LockIcon, UnlockIcon } from "lucide-react"

import { Button } from "../../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip"
import { IconSize } from "../../ui/typography"

export function EditModeTogglePlugin() {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={"ghost"}
          onClick={() => {
            editor.setEditable(!editor.isEditable())
            setIsEditable(editor.isEditable())
          }}
          title="Read-Only Mode"
          aria-label={`${!isEditable ? "Unlock" : "Lock"} read-only mode`}
          size={"sm"}
          className="editor-p-2"
        >
          {isEditable ? (
            <IconSize size="sm">
              <LockIcon />
            </IconSize>
          ) : (
            <IconSize size="sm">
              <UnlockIcon />
            </IconSize>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isEditable ? "View Only Mode" : "Edit Mode"}
      </TooltipContent>
    </Tooltip>
  )
}
