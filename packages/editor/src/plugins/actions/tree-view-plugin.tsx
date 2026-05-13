"use client"

import { JSX } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { TreeView } from "@lexical/react/LexicalTreeView"
import { NotebookPenIcon } from "lucide-react"

import { Button } from "../../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip"
import { ScrollArea, ScrollBar } from "../../ui/scroll-area"
import { IconSize } from "../../ui/typography"

export function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext()
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button size={"sm"} variant={"ghost"} className="editor-p-2">
              <IconSize size="sm">
                <NotebookPenIcon />
              </IconSize>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>View Tree</TooltipContent>
      </Tooltip>
      <DialogContent disableOutsideClick={true}>
        <DialogHeader>
          <DialogTitle>Tree View</DialogTitle>
          <DialogDescription>
            Xem cấu trúc cây của nội dung editor
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="editor-tree-view-scroll-area">
          <TreeView
            viewClassName="tree-view-output"
            treeTypeButtonClassName="debug-treetype-button"
            timeTravelPanelClassName="debug-timetravel-panel"
            timeTravelButtonClassName="debug-timetravel-button"
            timeTravelPanelSliderClassName="debug-timetravel-panel-slider"
            timeTravelPanelButtonClassName="debug-timetravel-panel-button"
            editor={editor}
          />
          <ScrollBar />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
