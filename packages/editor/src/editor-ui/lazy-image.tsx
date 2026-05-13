import * as React from "react"
import { JSX, useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "../lib/utils"
import { 
  DimensionValue, 
  imageCache, 
  DEFAULT_WIDTH, 
  DEFAULT_HEIGHT, 
  DEFAULT_DIMENSIONS 
} from "./hooks/use-responsive-image-dimensions"

interface LazyImageProps {
  altText: string
  className: string | null
  height: DimensionValue
  imageRef: { current: null | HTMLImageElement }
  maxWidth: number
  src: string
  width: DimensionValue
  onError: () => void
  fetchPriority?: "high" | "low" | "auto"
}

/**
 * LazyImage - Handles image loading and rendering within the Lexical editor.
 * Includes dimensions caching to prevent layout shift.
 */
export function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- prop reserved for future use
  maxWidth: _maxWidth,
  onError,
  fetchPriority = "auto",
}: LazyImageProps): JSX.Element {
  // Convert DimensionValue to number for width/height attributes
  const getNumericValue = (value: DimensionValue): number | undefined => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      if (value === "inherit") return undefined
      const num = parseInt((value as string).replace("px", ""), 10)
      return isNaN(num) ? undefined : num
    }
    return undefined
  }
  
  const widthAttr = getNumericValue(width)
  const heightAttr = getNumericValue(height)
  
  const cachedDims = imageCache.get(src)
  const [actualDimensions, setActualDimensions] = useState<{ width?: number; height?: number; ratio?: number }>(
    cachedDims || DEFAULT_DIMENSIONS
  )
  
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (wrapperRef.current) {
      const imgElement = wrapperRef.current.querySelector("img") as HTMLImageElement | null
      if (imgElement) {
        imageRef.current = imgElement
        if ((width === "inherit" || height === "inherit") && imgElement.complete && imgElement.naturalWidth && imgElement.naturalHeight) {
          const ratio = imgElement.naturalWidth / imgElement.naturalHeight
          setActualDimensions({
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
            ratio,
          })
          imageCache.set(src, {
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight,
            ratio,
          })
        }
      }
    }
  }, [width, height, imageRef, src])
  
  const getSizes = (): string => {
    if (typeof widthAttr === "number" && widthAttr > 0) {
      if (widthAttr <= 640) return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    }
    return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  }

  const renderWidth = widthAttr || actualDimensions.width || DEFAULT_WIDTH
  const renderHeight = heightAttr || actualDimensions.height || DEFAULT_HEIGHT

  return (
    <div ref={wrapperRef} className={cn("editor-lazy-image-wrapper", className)}>
      <Image
        src={src}
        alt={altText}
        title={altText}
        width={renderWidth}
        height={renderHeight}
        sizes={getSizes()}
        quality={75}
        unoptimized={true}
        style={{
          height: height === "inherit" ? "auto" : height,
          width: width === "inherit" ? "100%" : width,
        }}
        onError={onError}
        draggable={false}
        priority={fetchPriority === "high"}
        loading="eager"
        decoding="async"
        onLoad={(e) => {
          const img = e.currentTarget
          if (img) {
            imageRef.current = img
            const ratio = img.naturalWidth / img.naturalHeight
            imageCache.set(src, {
              width: img.naturalWidth,
              height: img.naturalHeight,
              ratio,
            })
            if (width === "inherit" || height === "inherit") {
              setActualDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
              })
            }
          }
        }}
      />
    </div>
  )
}
