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
import { useEditorUploads, FolderNode } from "../context/uploads-context"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { TypographySpanSmallMuted } from "../ui/typography"

export type InsertImagePayload = Readonly<ImagePayload>

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND")

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")
  const [altText, setAltText] = useState("")

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
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
          data-test-id="image-modal-confirm-btn"
        >
          Confirm
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageUploadedDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [src, setSrc] = useState("")
  const [altText, setAltText] = useState("")

  const isDisabled = src === ""

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader()
    reader.onload = function () {
      if (typeof reader.result === "string") {
        setSrc(reader.result)
      }
      return ""
    }
    if (files && files[0]) {
      reader.readAsDataURL(files[0])  
    }
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
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => onClick({ altText, src })}
          data-test-id="image-modal-file-upload-btn"
        >
          Confirm
        </Button>
      </DialogFooter>
    </div>
  )
}

function flattenImages(folder: FolderNode | undefined): Array<{
  fileName: string
  originalName: string
  url: string
  path?: string
}> {
  if (!folder) return []
  const result: Array<{ fileName: string; originalName: string; url: string; path?: string }> = []

  const walk = (node: FolderNode) => {
    node.images.forEach((image) => {
      result.push({
        fileName: image.fileName,
        originalName: image.originalName,
        url: image.url,
        path: node.path || undefined,
      })
    })
    node.subfolders.forEach(walk)
  }

  walk(folder)
  return result
}

export function InsertImageUploadsDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [altText, setAltText] = useState("")

  const { folderTree, isLoading } = useEditorUploads()
  const allImages = React.useMemo(() => flattenImages(folderTree), [folderTree])

  const isDisabled = !selectedImage

  const handleImageSelect = React.useCallback((imageUrl: string, originalName: string) => {
    setSelectedImage(imageUrl)
    setAltText((prev) => prev || originalName)
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (selectedImage) {
      // Đảm bảo URL là absolute nếu là relative URL từ uploads
      let imageUrl = selectedImage
      if (imageUrl.startsWith("/api/uploads")) {
        // Relative URL từ uploads - giữ nguyên vì nó sẽ hoạt động với same-origin
        imageUrl = selectedImage
      } else if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://") && !imageUrl.startsWith("data:")) {
        // Nếu không phải absolute URL và không phải data URL, thêm protocol
        imageUrl = `https://${imageUrl}`
      }
      
      onClick({ altText: altText || "", src: imageUrl })
    }
  }, [selectedImage, altText, onClick])

  // Listen for double-click confirm event
  React.useEffect(() => {
    const handleDoubleClickConfirm = () => {
      // Use a ref to get the latest selectedImage
      setTimeout(() => {
        handleConfirm()
      }, 50)
    }
    
    document.addEventListener("confirm-image-insert", handleDoubleClickConfirm)
    return () => {
      document.removeEventListener("confirm-image-insert", handleDoubleClickConfirm)
    }
  }, [handleConfirm])

  return (
    <div className="editor-form-grid">
      <div className="editor-form-item">
        <Label>Chọn hình ảnh từ thư viện</Label>
        {isLoading ? (
          <Flex align="center" justify="center" className="editor-py-8">
            <Loader2 className="editor-loader" />
          </Flex>
        ) : allImages.length === 0 ? (
          <div className="editor-empty-state">
            <TypographySpanSmallMuted>Chưa có hình ảnh nào được upload</TypographySpanSmallMuted>
          </div>
        ) : (
          <div className="editor-scroll-area editor-flex editor-flex-col editor-gap-1">
            <div className="editor-image-list">
              {allImages.map((image) => (
                <button
                  key={`${image.path || "root"}-${image.fileName}`}
                  type="button"
                  onClick={() => handleImageSelect(image.url, image.originalName)}
                  onDoubleClick={() => {
                    handleImageSelect(image.url, image.originalName)
                    setTimeout(() => {
                      const event = new Event("confirm-image-insert", { bubbles: true })
                      document.dispatchEvent(event)
                    }, 100)
                  }}
                  className={`editor-image-btn ${
                    selectedImage === image.url
                      ? "editor-image-btn--selected"
                      : ""
                  }`}
                  title={`${image.originalName} - Double-click để chèn ngay`}
                >
                  <span className="editor-image-btn__thumb">
                    <Image
                      src={image.url}
                      alt={image.originalName}
                      title={image.originalName}
                      fill
                      className="editor-object-cover editor-article-image editor-article-image-ux-impr editor-article-image-new editor-expandable"
                      sizes="64px"
                      unoptimized
                      loading="eager"
                    />
                  </span>
                  <span className="editor-image-btn__meta">
                    <span className="editor-image-btn__name">{image.originalName}</span>
                    <span className="editor-image-btn__path">
                      {image.path ? `${image.path}/` : ""}
                      {image.fileName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {selectedImage && (
        <div className="editor-form-item">
          <Label htmlFor="alt-text-uploads">Alt Text</Label>
          <Input
            id="alt-text-uploads"
            placeholder="Mô tả hình ảnh"
            onChange={(e) => setAltText(e.target.value)}
            value={altText}
            data-test-id="image-modal-uploads-alt-text-input"
          />
        </div>
      )}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={handleConfirm}
          data-test-id="image-modal-uploads-confirm-btn"
        >
          Chèn hình ảnh
        </Button>
      </DialogFooter>
    </div>
  )
}

export function InsertImageDialog({
  activeEditor,
  onClose,
  onInsert,
  activeTab = "uploads",
}: {
  activeEditor: LexicalEditor
  onClose: () => void
  onInsert?: (payload: InsertImagePayload, close: () => void) => void
  activeTab?: string
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
        <TabsTrigger value="uploads" className="editor-tabs-trigger">
          Thư viện
        </TabsTrigger>
        <TabsTrigger value="url" className="editor-tabs-trigger">
          URL
        </TabsTrigger>
        <TabsTrigger value="file" className="editor-tabs-trigger">
          File
        </TabsTrigger>
      </TabsList>
      <TabsContent value="uploads">
        <InsertImageUploadsDialogBody onClick={onClick} />
      </TabsContent>
      <TabsContent value="url">
        <InsertImageUriDialogBody onClick={onClick} />
      </TabsContent>
      <TabsContent value="file">
        <InsertImageUploadedDialogBody onClick={onClick} />
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
