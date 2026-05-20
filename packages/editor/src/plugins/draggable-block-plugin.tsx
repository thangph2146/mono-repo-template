"use client"

import { JSX, useRef } from "react"
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin"
import { GripVerticalIcon } from "lucide-react"
import { IconSize } from "../ui/typography"

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "editor-draggable-menu"

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`)
}

export function DraggableBlockPlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement | null
}): JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)

  if (!anchorElem) {
    return null
  }

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef as React.RefObject<HTMLDivElement>}
      targetLineRef={targetLineRef as React.RefObject<HTMLDivElement>}
      menuComponent={
        <div ref={menuRef} className="editor-draggable-menu">
          <IconSize size="sm" className="editor-opacity-30">
            <GripVerticalIcon />
          </IconSize>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="editor-draggable-line" />
      }
      isOnMenu={isOnMenu}
    />
  )
}
