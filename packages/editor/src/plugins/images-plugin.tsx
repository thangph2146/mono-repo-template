"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX, useEffect, useRef, useState } from "react"
import * as React from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils"
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from "lexical"

import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  ImagePayload,
} from "../nodes/image-node"
import { CAN_USE_DOM } from "../shared/can-use-dom"
import { Button } from "../ui/button"
import { DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Flex } from "../ui/flex"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs"
import { logger } from "../lib/logger"
import { TypographySpanSmallMuted } from "../ui/typography"

export type InsertImagePayload = Readonly<ImagePayload>
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND")

export function InsertImageUriDialogBody({
  onClick,
  initialSrc = "",
  initialAltText = "",
  confirmLabel = "Confirm",
}: {
  onClick: (payload: InsertImagePayload) => void
  initialSrc?: string
  initialAltText?: string
  confirmLabel?: string
}) {
  const [src, setSrc] = useState(initialSrc)
  const [altText, setAltText] = useState(initialAltText)
  const normalizedSrc = src.trim()
  const canPreview = /^https?:\/\//i.test(normalizedSrc) || normalizedSrc.startsWith("/api/uploads")

  useEffect(() => {
    setSrc(initialSrc)
    setAltText(initialAltText)
  }, [initialAltText, initialSrc])

  const isDisabled = src === ""

  return (
    <div className="editor-form-grid">
      <div className="editor-form-item">
        <Label htmlFor="image-url">Image URL</Label>
        <Input
          id="image-url"
          placeholder="i.e. https://source.unsplash.com/random"
          onChange={(e) => setSrc(e.target.value)}
          value={src}
          data-test-id="image-modal-url-input"
        />
      </div>
      <div className="editor-form-item">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Random unsplash image"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      {canPreview ? (
        <div className="editor-form-item">
          <Label>Xem trước</Label>
          <div className="editor-image-preview">
            <img
              src={normalizedSrc}
              alt={altText || "image-preview-url"}
              className="editor-image-preview__image"
            />
          </div>
        </div>
      ) : null}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => {
            logger.debug("[InsertImageDialog] Confirm image by URL", {
              srcType: normalizedSrc.startsWith("/api/uploads") ? "uploads" : "url",
              hasAltText: Boolean(altText.trim()),
            })
            onClick({ altText, src })
          }}
          data-test-id="image-modal-confirm-btn"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageUploadedDialogBody({
  onClick,
  initialSrc = "",
  initialAltText = "",
  confirmLabel = "Confirm",
}: {
  onClick: (payload: InsertImagePayload) => void
  initialSrc?: string
  initialAltText?: string
  confirmLabel?: string
}) {
  const [src, setSrc] = useState(initialSrc.startsWith("data:") ? initialSrc : "")
  const [altText, setAltText] = useState(initialAltText)
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    setSrc(initialSrc.startsWith("data:") ? initialSrc : "")
    setAltText(initialAltText)
    setUploadError("")
  }, [initialAltText, initialSrc])

  const isDisabled = src === ""

  const loadImage = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setUploadError("Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.")
      setSrc("")
      return
    }

    setUploadError("")
    const reader = new FileReader()
    reader.onload = function () {
      if (typeof reader.result === "string") {
        setSrc(reader.result)
      }
      return ""
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="editor-form-grid">
      <div className="editor-form-item">
        <Label htmlFor="image-upload">Image Upload</Label>
        <Input
          id="image-upload"
          type="file"
          onChange={(e) => loadImage(e.target.files)}
          accept="image/*"
          data-test-id="image-modal-file-upload"
        />
        {uploadError ? (
          <TypographySpanSmallMuted className="editor-text-destructive">
            {uploadError}
          </TypographySpanSmallMuted>
        ) : (
          <TypographySpanSmallMuted>
            Dung lượng tối đa: 5MB
          </TypographySpanSmallMuted>
        )}
      </div>
      <div className="editor-form-item">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      {src.trim() ? (
        <div className="editor-form-item">
          <Label>Xem trước</Label>
          <div className="editor-image-preview">
            <img
              src={src.trim()}
              alt={altText || "image-preview-file"}
              className="editor-image-preview__image"
            />
          </div>
        </div>
      ) : null}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => {
            logger.debug("[InsertImageDialog] Confirm image by file/base64", {
              hasBase64: src.trim().startsWith("data:"),
              hasAltText: Boolean(altText.trim()),
            })
            onClick({ altText, src })
          }}
          data-test-id="image-modal-file-upload-btn"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageDialog({
  activeEditor,
  onClose,
  onInsert,
  activeTab = "url",
  initialValues,
  confirmLabel = "Confirm",
}: {
  activeEditor: LexicalEditor
  onClose: () => void
  onInsert?: (payload: InsertImagePayload, close: () => void) => void
  activeTab?: string
  initialValues?: { src?: string; altText?: string }
  confirmLabel?: string
}): JSX.Element {
  const hasModifier = useRef(false)

  useEffect(() => {
    hasModifier.current = false
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey
    }
    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
    }
  }, [activeEditor])

  const onClick = (payload: InsertImagePayload) => {
    if (onInsert) {
      onInsert(payload, onClose)
      return
    }
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload)
    onClose()
  }

  return (
    <Tabs defaultValue={activeTab}>
      <TabsList className="editor-tabs-list">
        <TabsTrigger value="url" className="editor-tabs-trigger">
          URL
        </TabsTrigger>
        <TabsTrigger value="file" className="editor-tabs-trigger">
          File
        </TabsTrigger>
      </TabsList>
      <TabsContent value="url">
        <InsertImageUriDialogBody
          onClick={onClick}
          initialSrc={initialValues?.src ?? ""}
          initialAltText={initialValues?.altText ?? ""}
          confirmLabel={confirmLabel}
        />
      </TabsContent>
      <TabsContent value="file">
        <InsertImageUploadedDialogBody
          onClick={onClick}
          initialSrc={initialValues?.src ?? ""}
          initialAltText={initialValues?.altText ?? ""}
          confirmLabel={confirmLabel}
        />
      </TabsContent>
    </Tabs>
  )
}

export function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor")
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload)
          $insertNodes([imageNode])
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event)
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event)
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor)
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [captionsEnabled, editor])

  return null
}

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    return false
  }
  const TRANSPARENT_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  const img = document.createElement("img")
  img.src = TRANSPARENT_IMAGE
  dataTransfer.setData("text/plain", "_")
  dataTransfer.setDragImage(img, 0, 0)
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width,
        },
      type: "image",
    })
  )

  return true
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  if (!canDropImage(event)) {
    event.preventDefault()
  }
  return true
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection()
  if (!node) {
    return false
  }
  const data = getDragImageData(event)
  if (!data) {
    return false
  }
  event.preventDefault()
  if (canDropImage(event)) {
    const range = getDragSelection(event)
    node.remove()
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data)
  }
  return true
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag")
  if (!dragData) {
    return null
  }
  const { type, data } = JSON.parse(dragData)
  if (type !== "image") {
    return null
  }

  return data
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest("code, span.editor-image") &&
    target.parentElement &&
    target.parentElement.closest("div.ContentEditable__root")
  )
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as null | Element | Document
  const targetWindow =
    target == null
      ? null
      : target.nodeType === 9
        ? (target as Document).defaultView
        : (target as Element).ownerDocument.defaultView
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
