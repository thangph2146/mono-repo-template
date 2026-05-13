"use client"

import { ImageIcon } from "lucide-react"

import { useToolbarContext } from "../../../context/toolbar-context"
import { InsertImageDialog } from "../../../plugins/images-plugin"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"
import { IconSize } from "../../../ui/typography"

export function InsertImage() {
  const { activeEditor, showModal } = useToolbarContext()

  return (
    <SelectItem
      value="image"
      onPointerUp={() => {
        showModal("Insert Image", (onClose) => (
          <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
        ), false, "editor-dialog-content--image")
      }}
      className=""
    >
      <Flex align="center" gap={2}>
        <IconSize size="sm">
          <ImageIcon />
        </IconSize>
        <span>Image</span>
      </Flex>
    </SelectItem>
  )
}
