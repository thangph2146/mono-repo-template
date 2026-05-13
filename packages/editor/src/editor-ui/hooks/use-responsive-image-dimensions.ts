"use client"
import { useState, useEffect } from "react"
import { LexicalEditor } from "lexical"
import { 
  getContainerWidth, 
  getImageAspectRatio 
} from "../image-sizing"

export type DimensionValue = "inherit" | number

export const imageCache = new Map<string, { width: number; height: number; ratio: number }>()
export const DEFAULT_ASPECT_RATIO = 16 / 9
export const DEFAULT_WIDTH = 800
export const DEFAULT_HEIGHT = Math.round(DEFAULT_WIDTH / DEFAULT_ASPECT_RATIO)
export const DEFAULT_DIMENSIONS = { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT, ratio: DEFAULT_ASPECT_RATIO }

interface UseResponsiveImageDimensionsProps {
  editor: LexicalEditor
  height: DimensionValue
  imageRef: { current: null | HTMLImageElement }
  width: DimensionValue
  isResizing: boolean
  fullWidth?: boolean
  maxWidthLimit?: number
  src: string
}

/**
 * Custom hook to handle responsive image dimensions.
 * Calculates width and height based on container width and image aspect ratio.
 */
export function useResponsiveImageDimensions({
  editor,
  height,
  imageRef,
  width,
  isResizing,
  fullWidth,
  maxWidthLimit,
  src,
}: UseResponsiveImageDimensionsProps) {
  const [dimensions, setDimensions] = useState<{
    width: DimensionValue
    height: DimensionValue
  }>({
    width,
    height,
  })

  useEffect(() => {
    if (isResizing) {
      return
    }

    let cancelScheduledUpdate: null | (() => void) = null
    const cleanupTasks: Array<() => void> = []

    const scheduleDimensionsUpdate = (next: {
      width: DimensionValue
      height: DimensionValue
    }) => {
      if (cancelScheduledUpdate) {
        cancelScheduledUpdate()
      }

      const applyNext = () => {
        cancelScheduledUpdate = null
        setDimensions((prev) => {
          if (prev.width === next.width && prev.height === next.height) {
            return prev
          }
          return next
        })
      }

      if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
      ) {
        const frameId = window.requestAnimationFrame(applyNext)
        cancelScheduledUpdate = () => window.cancelAnimationFrame(frameId)
      } else {
        const timeoutId = setTimeout(applyNext)
        cancelScheduledUpdate = () => clearTimeout(timeoutId)
      }
    }

    const editorRoot = editor.getRootElement()
    const image = imageRef.current

    if (fullWidth) {
      scheduleDimensionsUpdate({ width: "inherit", height: "inherit" })
      return () => {
        cancelScheduledUpdate?.()
      }
    }

    if (!image) {
      scheduleDimensionsUpdate({ width, height })
      return () => {
        cancelScheduledUpdate?.()
      }
    }





    const updateDimensions = () => {
      if (fullWidth) {
        scheduleDimensionsUpdate({ width: "inherit", height: "inherit" })
        return
      }

      const containerWidth = getContainerWidth(
        image,
        editorRoot,
        maxWidthLimit
      )

      if (!containerWidth) {
        scheduleDimensionsUpdate({ width, height })
        return
      }

      const cached = imageCache.get(src)
      const baseWidth =
        typeof width === "number"
          ? width
          : image.naturalWidth || cached?.width || image.getBoundingClientRect().width || containerWidth

      let baseHeight: DimensionValue
      if (typeof height === "number") {
        baseHeight = height
      } else if (image.naturalHeight > 0) {
        baseHeight = image.naturalHeight
      } else if (cached?.height) {
        baseHeight = cached.height
      } else {
        const ratio = cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
        baseHeight = ratio > 0 ? Math.round(baseWidth / ratio) : "inherit"
      }

      let nextWidth: DimensionValue = baseWidth
      let nextHeight: DimensionValue = baseHeight

      if (
        width === "inherit" &&
        typeof baseWidth === "number" &&
        baseWidth > containerWidth
      ) {
        const scale = containerWidth / baseWidth
        nextWidth = containerWidth
        if (typeof baseHeight === "number") {
          nextHeight = Math.max(Math.round(baseHeight * scale), 1)
        } else if (baseHeight === "inherit") {
          const ratio = cached?.ratio || getImageAspectRatio(image) || DEFAULT_ASPECT_RATIO
          nextHeight =
            ratio > 0 ? Math.max(Math.round(containerWidth / ratio), 1) : baseHeight
        }
      }

      scheduleDimensionsUpdate({ width: nextWidth, height: nextHeight })
    }

    updateDimensions()

    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(updateDimensions)
      if (editorRoot) {
        resizeObserver.observe(editorRoot)
      }
      if (image.parentElement) {
        resizeObserver.observe(image.parentElement)
      }
      cleanupTasks.push(() => {
        resizeObserver.disconnect()
      })
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions)
      cleanupTasks.push(() => {
        window.removeEventListener("resize", updateDimensions)
      })
    }

    return () => {
      cancelScheduledUpdate?.()
      cleanupTasks.forEach((task) => task())
    }
  }, [
    editor,
    height,
    imageRef,
    isResizing,
    width,
    fullWidth,
    maxWidthLimit,
    src,
  ])

  return dimensions
}
