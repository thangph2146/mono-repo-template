"use client"
import * as React from "react"
import { JSX, Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalEditable } from "@lexical/react/useLexicalEditable"
import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isNodeSelection,
  ElementFormatType,
  ElementNode,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from "lexical"

import { ImageResizer } from "../editor-ui/image-resizer"
import { $isImageNode, ImageNode } from "../nodes/image-node"
import { cn } from "../lib/utils"
import { useEditorContainer } from "../context/editor-container-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { InsertImageDialog } from "./dialogs"
import type { InsertImagePayload } from "./dialogs"
import { usePriorityImage } from "../context/priority-image-context"
import {
  ImageLightboxDialog,
  type LightboxImage,
} from "./image-lightbox-dialog"

// Sub-components
import { LazyImage } from "./lazy-image"
import { BrokenImage } from "./broken-image"
import { ImagePlaceholder } from "./image-placeholder"
import { CaptionComposer } from "./caption-composer"

// Hooks
import {
  useResponsiveImageDimensions,
  DimensionValue,
} from "./hooks/use-responsive-image-dimensions"
import { useImageCaptionControls } from "./hooks/use-image-caption-controls"
import { useImageNodeInteractions } from "./hooks/use-image-node-interactions"

const RESIZE_HANDLE_HIDE_DELAY = 200

const collectImages = (node: LexicalNode, images: LightboxImage[]) => {
  if ($isImageNode(node)) {
    const imageNode = node as ImageNode
    images.push({
      key: imageNode.getKey(),
      src: imageNode.getSrc(),
      altText: imageNode.getAltText(),
    })
    return
  }
  if ($isElementNode(node)) {
    ;(node as ElementNode)
      .getChildren()
      .forEach((child) => collectImages(child, images))
  }
}

interface ImageComponentProps {
  altText: string
  caption: LexicalEditor
  captionsEnabled: boolean
  fullWidth: boolean
  height: DimensionValue
  maxWidth: number
  nodeKey: NodeKey
  resizable: boolean
  showCaption: boolean
  src: string
  width: DimensionValue
}

/**
 * ImageComponent - The main component for image nodes in the Lexical editor.
 * Orchestrates image rendering, resizing, captions, and interactions.
 */
export default function ImageComponent({
  altText,
  caption,
  captionsEnabled,
  fullWidth,
  height,
  maxWidth,
  nodeKey,
  resizable,
  showCaption,
  src,
  width,
}: ImageComponentProps): JSX.Element {
  const resolveReplaceDialogTab = useCallback(() => {
    const currentSrc = src.trim().toLowerCase()
    if (currentSrc.startsWith("data:")) return "file"
    return "url"
  }, [src])

  const imageRef = useRef<null | HTMLImageElement>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editor] = useLexicalComposerContext()
  const [isLoadError, setIsLoadError] = useState<boolean>(false)
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false)
  const isEditable = useLexicalEditable()
  const [lightbox, setLightbox] = useState<null | {
    images: LightboxImage[]
    index: number
  }>(null)
  const editorContainer = useEditorContainer()

  const prioritySrc = usePriorityImage()
  const isPriority = src === prioritySrc

  // Custom hooks for logic separation
  const { hasCaptionContent, localShowCaption, setShowCaption } =
    useImageCaptionControls({
      caption,
      editor,
      nodeKey,
      showCaption,
    })

  const responsiveDimensions = useResponsiveImageDimensions({
    editor,
    imageRef,
    width,
    height,
    isResizing,
    fullWidth,
    maxWidthLimit: editorContainer?.maxWidth,
    src,
  })

  const { isSelected, selection } = useImageNodeInteractions({
    buttonRef,
    caption,
    editor,
    imageRef,
    isResizing,
    nodeKey,
    showCaption,
  })

  useEffect(() => {
    if (!isEditable && isReplaceDialogOpen) {
      setTimeout(() => {
        setIsReplaceDialogOpen(false)
      }, 0)
    }
  }, [isEditable, isReplaceDialogOpen])

  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [])

  const onResizeEnd = useCallback(
    (nextWidth: DimensionValue, nextHeight: DimensionValue) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
      resizeTimeoutRef.current = setTimeout(() => {
        setIsResizing(false)
      }, RESIZE_HANDLE_HIDE_DELAY)

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setWidthAndHeight(nextWidth, nextHeight)
        }
      })
    },
    [editor, nodeKey]
  )

  const onResizeStart = useCallback(() => {
    setIsResizing(true)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.setFullWidth(false)
      }
    })
  }, [editor, nodeKey])

  useEffect(() => {
    const element = editor.getElementByKey(nodeKey)
    if (element) {
      if (fullWidth) {
        element.style.width = "100%"
        element.style.display = "block"
      } else {
        element.style.width = ""
        element.style.display = "inline-block"
      }
    }
  }, [editor, nodeKey, fullWidth])

  const onSetFullWidth = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.setFullWidth(!fullWidth)
      }
    })
  }, [editor, fullWidth, nodeKey])

  const onAlign = useCallback(
    (format: ElementFormatType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)
    },
    [editor]
  )

  const handleReplaceImage = useCallback(
    (payload: InsertImagePayload) => {
      if (!payload?.src) {
        return
      }
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setSrc(payload.src)
          if (payload.altText !== undefined) {
            node.setAltText(payload.altText)
          }
          node.setWidthAndHeight("inherit", "inherit")
        }
      })
    },
    [editor, nodeKey]
  )

  const onDelete = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isImageNode(node)) {
        node.remove()
      }
    })
  }, [editor, nodeKey])

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing
  const isFocused = (isSelected || isResizing) && isEditable
  const shouldRenderCaption =
    showCaption &&
    (isEditable ? localShowCaption && captionsEnabled : hasCaptionContent)

  const imageClassName = cn(
    "editor-image",
    isFocused && "editor-image-focused",
    isFocused && $isNodeSelection(selection) && "editor-image-draggable",
    fullWidth && "full-width"
  )

  const captionWrapperClass = cn(
    "editor-image-caption",
    isEditable ? "editable" : "readonly"
  )

  const openLightbox = useCallback(() => {
    if (isEditable) return
    const images = editor.getEditorState().read(() => {
      const list: LightboxImage[] = []
      collectImages($getRoot(), list)
      return list
    })
    if (images.length === 0) return
    const index = Math.max(
      0,
      images.findIndex((img) => img.key === nodeKey)
    )
    setLightbox({ images, index })
  }, [editor, isEditable, nodeKey])

  return (
    <Suspense
      fallback={
        <div draggable={draggable}>
          <ImagePlaceholder
            width={responsiveDimensions.width}
            height={responsiveDimensions.height}
          />
        </div>
      }
    >
      <>
        <div draggable={draggable} style={{ display: "inline-block" }}>
          {isLoadError ? (
            <BrokenImage />
          ) : !isEditable ? (
            <button
              type="button"
              className="editor-image-link"
              aria-label="Xem ảnh lớn"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openLightbox()
              }}
            >
              <LazyImage
                className={imageClassName}
                src={src}
                altText={altText}
                imageRef={imageRef}
                width={responsiveDimensions.width}
                height={responsiveDimensions.height}
                maxWidth={maxWidth}
                onError={() => setIsLoadError(true)}
                fetchPriority={isPriority ? "high" : "auto"}
              />
            </button>
          ) : (
            <LazyImage
              className={imageClassName}
              src={src}
              altText={altText}
              imageRef={imageRef}
              width={responsiveDimensions.width}
              height={responsiveDimensions.height}
              maxWidth={maxWidth}
              onError={() => setIsLoadError(true)}
              fetchPriority={isPriority ? "high" : "auto"}
            />
          )}
        </div>

        {shouldRenderCaption && (
          <div className={captionWrapperClass}>
            <CaptionComposer caption={caption} isEditable={isEditable} />
          </div>
        )}

        {resizable && isFocused && (
          <ImageResizer
            buttonRef={buttonRef}
            showCaption={showCaption}
            setShowCaption={setShowCaption}
            editor={editor}
            mediaRef={imageRef}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            captionsEnabled={captionsEnabled}
            onReplaceMedia={() => setIsReplaceDialogOpen(true)}
            onSetFullWidth={onSetFullWidth}
            isFullWidth={fullWidth}
            onDelete={onDelete}
            onAlign={onAlign}
          />
        )}

        {isEditable && isReplaceDialogOpen && (
          <Dialog
            open={isReplaceDialogOpen}
            onOpenChange={setIsReplaceDialogOpen}
          >
            <DialogContent
              className="editor-dialog-content--lg"
              disableOutsideClick={true}
            >
              <DialogHeader>
                <DialogTitle>Thay thế hình ảnh</DialogTitle>
              </DialogHeader>
              <InsertImageDialog
                onSubmit={(payload) => {
                  handleReplaceImage(payload)
                  setIsReplaceDialogOpen(false)
                }}
                activeTab={resolveReplaceDialogTab()}
                initialValues={{ src, altText }}
                confirmLabel="Thay thế hình ảnh"
                onClose={() => setIsReplaceDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {!isEditable && lightbox ? (
          <ImageLightboxDialog
            open={true}
            images={lightbox.images}
            index={lightbox.index}
            onIndexChange={(nextIndex) =>
              setLightbox((prev) =>
                prev ? { ...prev, index: nextIndex } : prev
              )
            }
            onClose={() => setLightbox(null)}
          />
        ) : null}
      </>
    </Suspense>
  )
}
