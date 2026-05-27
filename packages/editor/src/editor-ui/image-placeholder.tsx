import * as React from "react"
import { JSX } from "react"
import { DimensionValue } from "./hooks/use-responsive-image-dimensions"

interface ImagePlaceholderProps {
  width: DimensionValue
  height: DimensionValue
}

/**
 * ImagePlaceholder - Rendered while an image is loading or when dimensions are being calculated.
 */
export function ImagePlaceholder({
  width,
  height,
}: ImagePlaceholderProps): JSX.Element {
  const MAX_CONTAINER_WIDTH = 800
  const MAX_CONTAINER_HEIGHT = 600

  const getNumeric = (val: DimensionValue, max: number) => {
    if (typeof val === "number") return val
    return max
  }

  const pWidth = getNumeric(width, MAX_CONTAINER_WIDTH)
  const pHeight = getNumeric(height, MAX_CONTAINER_HEIGHT)

  return (
    <div
      className="editor-article-image-placeholder editor-animate-pulse editor-bg-muted editor-flex editor-items-center editor-justify-center editor-rounded-lg"
      style={{
        width: width === "inherit" ? "100%" : pWidth,
        height: height === "inherit" ? "auto" : pHeight,
        aspectRatio:
          width === "inherit" || height === "inherit" ? "16/9" : undefined,
        maxWidth: "100%",
      }}
    >
      <div className="editor-flex editor-flex-col editor-items-center editor-gap-2 editor-text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      </div>
    </div>
  )
}
