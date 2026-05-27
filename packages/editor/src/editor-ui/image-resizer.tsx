"use client"
import * as React from "react"
import { JSX, useRef } from "react"
import { calculateZoomLevel } from "@lexical/utils"
import type { LexicalEditor } from "lexical"
import {
  ImagePlus,
  ImageMinus,
  Maximize2,
  Minimize2,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"

import { Button } from "../ui/button"
import {
  getContainerWidth,
  getImageAspectRatio,
} from "../editor-ui/image-sizing"
import { useEditorContainer } from "../context/editor-container-context"
import { IconSize } from "../ui/typography"

function clamp(value: number, min: number, max: number) {
  // Nếu max là Infinity, chỉ giới hạn min
  if (max === Infinity) {
    return Math.max(value, min)
  }
  return Math.min(Math.max(value, min), max)
}

const Direction = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
}

const RESIZE_HANDLES = [
  {
    key: "n",
    direction: Direction.north,
    className: "editor-image-resizer-handle editor-image-resizer-handle--n",
  },
  {
    key: "ne",
    direction: Direction.north | Direction.east,
    className: "editor-image-resizer-handle editor-image-resizer-handle--ne",
  },
  {
    key: "e",
    direction: Direction.east,
    className: "editor-image-resizer-handle editor-image-resizer-handle--e",
  },
  {
    key: "se",
    direction: Direction.south | Direction.east,
    className: "editor-image-resizer-handle editor-image-resizer-handle--se",
  },
  {
    key: "s",
    direction: Direction.south,
    className: "editor-image-resizer-handle editor-image-resizer-handle--s",
  },
  {
    key: "sw",
    direction: Direction.south | Direction.west,
    className: "editor-image-resizer-handle editor-image-resizer-handle--sw",
  },
  {
    key: "w",
    direction: Direction.west,
    className: "editor-image-resizer-handle editor-image-resizer-handle--w",
  },
  {
    key: "nw",
    direction: Direction.north | Direction.west,
    className: "editor-image-resizer-handle editor-image-resizer-handle--nw",
  },
] as const

export interface MediaResizerProps {
  editor: LexicalEditor
  buttonRef: { current: null | HTMLButtonElement }
  mediaRef: { current: null | HTMLElement }
  onResizeEnd: (width: "inherit" | number, height: "inherit" | number) => void
  onResizeStart: () => void
  showCaption?: boolean
  setShowCaption?: (show: boolean) => void
  captionsEnabled?: boolean
  onSetFullWidth?: () => void
  isFullWidth?: boolean
  unlockBoundaries?: boolean
  onReplaceMedia?: () => void
  maxWidth?: number
  onDelete?: () => void
  onAlign?: (format: "left" | "center" | "right") => void
}

/**
 * MediaResizer - Universal resizer for media elements (images, videos, etc.)
 * Supports both images with captions and videos without captions
 */
export function MediaResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  mediaRef,
  editor,
  showCaption = false,
  setShowCaption,
  captionsEnabled = false,
  onSetFullWidth,
  isFullWidth,
  unlockBoundaries = true,
  onReplaceMedia,
  maxWidth,
  onDelete,
  onAlign,
}: MediaResizerProps): JSX.Element {
  const controlWrapperRef = useRef<HTMLDivElement>(null)
  const userSelect = useRef({
    priority: "",
    value: "default",
  })
  const positioningRef = useRef<{
    currentHeight: "inherit" | number
    currentWidth: "inherit" | number
    direction: number
    isResizing: boolean
    ratio: number
    startHeight: number
    startWidth: number
    startX: number
    startY: number
    maxWidthLimit: number
  }>({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
    maxWidthLimit: Infinity,
  })
  const editorRootElement = editor.getRootElement()
  const maxHeightContainer = Infinity
  const editorContainer = useEditorContainer()
  const hardWidthLimit = maxWidth ?? editorContainer?.maxWidth

  const minWidth = 100
  const minHeight = 100

  React.useEffect(() => {
    // if (!unlockBoundaries) {
    //   return
    // }
    // if (mediaRef.current) {
    //   unlockImageBoundaries(mediaRef.current)
    // }
  }, [mediaRef, unlockBoundaries])

  const setStartCursor = (direction: number) => {
    const ew = direction === Direction.east || direction === Direction.west
    const ns = direction === Direction.north || direction === Direction.south
    const nwse =
      (direction & Direction.north && direction & Direction.west) ||
      (direction & Direction.south && direction & Direction.east)

    const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw"

    if (editorRootElement !== null) {
      editorRootElement.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      )
    }
    if (document.body !== null) {
      document.body.style.setProperty(
        "cursor",
        `${cursorDir}-resize`,
        "important"
      )
      userSelect.current.value = document.body.style.getPropertyValue(
        "-webkit-user-select"
      )
      userSelect.current.priority = document.body.style.getPropertyPriority(
        "-webkit-user-select"
      )
      document.body.style.setProperty(
        "-webkit-user-select",
        `none`,
        "important"
      )
    }
  }

  const setEndCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", "text")
    }
    if (document.body !== null) {
      document.body.style.setProperty("cursor", "default")
      document.body.style.setProperty(
        "-webkit-user-select",
        userSelect.current.value,
        userSelect.current.priority
      )
    }
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    direction: number
  ) => {
    if (!editor.isEditable()) {
      return
    }

    const media = mediaRef.current
    const controlWrapper = controlWrapperRef.current

    if (media !== null && controlWrapper !== null) {
      event.preventDefault()
      // if (unlockBoundaries) {
      //   unlockImageBoundaries(media)
      // }
      const { width, height } = media.getBoundingClientRect()
      const zoom = calculateZoomLevel(media)
      const positioning = positioningRef.current
      positioning.startWidth = width
      positioning.startHeight = height
      positioning.ratio = getImageAspectRatio(media)
      positioning.currentWidth = width
      positioning.currentHeight = height
      positioning.startX = event.clientX / zoom
      positioning.startY = event.clientY / zoom
      positioning.isResizing = true
      positioning.direction = direction

      const containerWidth = getContainerWidth(
        media,
        editorRootElement,
        hardWidthLimit
      )
      positioning.maxWidthLimit = containerWidth || hardWidthLimit || Infinity

      setStartCursor(direction)
      onResizeStart()

      controlWrapper.classList.add("touch-action-none")
      media.style.height = `${height}px`
      media.style.width = `${width}px`

      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
    }
  }
  const getEffectiveMaxWidth = () => {
    const maxFromPositioning =
      typeof positioningRef.current.maxWidthLimit === "number"
        ? positioningRef.current.maxWidthLimit
        : Infinity
    const maxFromContext =
      typeof hardWidthLimit === "number" ? hardWidthLimit : Infinity
    return Math.min(maxFromPositioning, maxFromContext)
  }
  const handlePointerMove = (event: PointerEvent) => {
    const media = mediaRef.current
    const positioning = positioningRef.current

    const isHorizontal =
      positioning.direction & (Direction.east | Direction.west)
    const isVertical =
      positioning.direction & (Direction.south | Direction.north)

    if (media !== null && positioning.isResizing) {
      const zoom = calculateZoomLevel(media)
      // Corner cursor
      if (isHorizontal && isVertical) {
        let diff = Math.floor(positioning.startX - event.clientX / zoom)
        diff = positioning.direction & Direction.east ? -diff : diff

        const effectiveMaxWidth = getEffectiveMaxWidth()
        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          effectiveMaxWidth || Infinity
        )
        const widthReachedLimit =
          effectiveMaxWidth !== Infinity &&
          width >= effectiveMaxWidth &&
          diff > 0

        const height = width / positioning.ratio
        media.style.width = `${width}px`
        media.style.height = `${height}px`
        positioning.currentHeight = height
        positioning.currentWidth = width
        if (widthReachedLimit) {
          return
        }
      } else if (isVertical) {
        let diff = Math.floor(positioning.startY - event.clientY / zoom)
        diff = positioning.direction & Direction.south ? -diff : diff

        const height = clamp(
          positioning.startHeight + diff,
          minHeight,
          maxHeightContainer
        )

        // Calculate width based on aspect ratio to maintain proportions
        const width = height * positioning.ratio
        media.style.height = `${height}px`
        media.style.width = `${width}px`
        positioning.currentHeight = height
        positioning.currentWidth = width
      } else {
        let diff = Math.floor(positioning.startX - event.clientX / zoom)
        diff = positioning.direction & Direction.east ? -diff : diff

        const effectiveMaxWidth = getEffectiveMaxWidth()
        const width = clamp(
          positioning.startWidth + diff,
          minWidth,
          effectiveMaxWidth || Infinity
        )
        const widthReachedLimit =
          effectiveMaxWidth !== Infinity &&
          width >= effectiveMaxWidth &&
          diff > 0

        // Calculate height based on aspect ratio to maintain proportions
        const height = width / positioning.ratio
        media.style.width = `${width}px`
        media.style.height = `${height}px`
        positioning.currentWidth = width
        positioning.currentHeight = height
        if (widthReachedLimit) {
          return
        }
      }
    }
  }
  const handlePointerUp = () => {
    const media = mediaRef.current
    const positioning = positioningRef.current
    const controlWrapper = controlWrapperRef.current
    if (media !== null && controlWrapper !== null && positioning.isResizing) {
      const width = positioning.currentWidth
      const height = positioning.currentHeight
      positioning.startWidth = 0
      positioning.startHeight = 0
      positioning.ratio = 0
      positioning.startX = 0
      positioning.startY = 0
      positioning.currentWidth = 0
      positioning.currentHeight = 0
      positioning.isResizing = false

      controlWrapper.classList.remove("touch-action-none")

      setEndCursor()
      onResizeEnd(width, height)

      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }
  }

  return (
    <>
      <div ref={controlWrapperRef}>
        {RESIZE_HANDLES.map(({ key, direction, className }) => (
          <div
            key={key}
            className={className}
            onPointerDown={(event) => {
              handlePointerDown(event, direction)
            }}
          />
        ))}
      </div>
      <div className="editor-mt-2 editor-flex editor-flex-wrap editor-justify-center editor-gap-2">
        {onDelete && (
          <Button
            className="editor-image-delete-button"
            type="button"
            variant="outline"
            size="sm"
            onClick={onDelete}
          >
            <IconSize size="sm" className="editor-mr-1-5">
              <Trash2 />
            </IconSize>
            Delete
          </Button>
        )}
        {onAlign && (
          <div className="editor-flex editor-gap-1">
            <Button
              className="editor-image-align-left-button"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlign("left")}
            >
              <IconSize size="sm">
                <AlignLeft />
              </IconSize>
            </Button>
            <Button
              className="editor-image-align-center-button"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlign("center")}
            >
              <IconSize size="sm">
                <AlignCenter />
              </IconSize>
            </Button>
            <Button
              className="editor-image-align-right-button"
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAlign("right")}
            >
              <IconSize size="sm">
                <AlignRight />
              </IconSize>
            </Button>
          </div>
        )}
        {onReplaceMedia && (
          <Button
            className="editor-image-replace-button"
            type="button"
            variant="outline"
            size="sm"
            onClick={onReplaceMedia}
          >
            Change Image
          </Button>
        )}
        {onSetFullWidth && (
          <Button
            className="editor-image-full-width-button"
            type="button"
            variant="outline"
            size="sm"
            onClick={onSetFullWidth}
          >
            {isFullWidth ? (
              <>
                <IconSize size="sm" className="editor-mr-1-5">
                  <Minimize2 />
                </IconSize>
                Reset Width
              </>
            ) : (
              <>
                <IconSize size="sm" className="editor-mr-1-5">
                  <Maximize2 />
                </IconSize>
                Full Width
              </>
            )}
          </Button>
        )}
        {setShowCaption && captionsEnabled && (
          <Button
            className="editor-image-caption-button"
            ref={buttonRef}
            type="button"
            variant={"outline"}
            size="sm"
            onClick={() => {
              setShowCaption(!showCaption)
            }}
          >
            {showCaption ? (
              <>
                <IconSize size="sm" className="editor-mr-1-5">
                  <ImageMinus />
                </IconSize>
                Remove Caption
              </>
            ) : (
              <>
                <IconSize size="sm" className="editor-mr-1-5">
                  <ImagePlus />
                </IconSize>
                Add Caption
              </>
            )}
          </Button>
        )}
      </div>
    </>
  )
}

// Backward compatibility: export as ImageResizer for existing code
export const ImageResizer = MediaResizer
