import * as React from "react"
import { useEffect, useMemo } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent } from "../ui/dialog"
import { cn } from "../lib/utils"

export type LightboxImage = {
  key: string
  src: string
  altText: string
}

export function ImageLightboxDialog({
  open,
  images,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean
  images: LightboxImage[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const safeIndex = useMemo(() => {
    if (!Number.isFinite(index) || images.length === 0) return 0
    return Math.min(images.length - 1, Math.max(0, index))
  }, [images.length, index])

  const current = images[safeIndex]
  const canNavigate = images.length > 1

  const goPrev = React.useCallback(() => {
    if (!canNavigate) return
    onIndexChange((safeIndex - 1 + images.length) % images.length)
  }, [canNavigate, images.length, onIndexChange, safeIndex])

  const goNext = React.useCallback(() => {
    if (!canNavigate) return
    onIndexChange((safeIndex + 1) % images.length)
  }, [canNavigate, images.length, onIndexChange, safeIndex])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
        return
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goPrev, onClose, open])

  if (!open || !current) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className="editor-dialog-content--lightbox">
        <div className="editor-lightbox">
          <div className="editor-lightbox__stage">
            <button
              type="button"
              className={cn("editor-lightbox__nav", "prev", !canNavigate && "is-disabled")}
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Ảnh trước"
            >
              <ChevronLeft />
            </button>

            <div className="editor-lightbox__image">
              <Image
                src={current.src}
                alt={current.altText || "image"}
                title={current.altText || "image"}
                fill
                sizes="(max-width: 768px) 96vw, 92vw"
                unoptimized
                priority
              />
            </div>

            <button
              type="button"
              className={cn("editor-lightbox__nav", "next", !canNavigate && "is-disabled")}
              onClick={goNext}
              disabled={!canNavigate}
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="editor-lightbox__footer">
            <div className="editor-lightbox__meta">
              <span className="editor-lightbox__counter">
                {safeIndex + 1} / {images.length}
              </span>
              {current.altText ? <span className="editor-lightbox__caption">{current.altText}</span> : null}
            </div>

            {images.length > 1 ? (
              <div className="editor-lightbox__thumbs" role="list">
                {images.map((img, idx) => (
                  <button
                    key={img.key}
                    type="button"
                    className={cn("editor-lightbox__thumb", idx === safeIndex && "is-active")}
                    onClick={() => onIndexChange(idx)}
                    aria-label={`Chọn ảnh ${idx + 1}`}
                    role="listitem"
                  >
                    <Image src={img.src} alt={img.altText || "image"} fill sizes="64px" unoptimized />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

