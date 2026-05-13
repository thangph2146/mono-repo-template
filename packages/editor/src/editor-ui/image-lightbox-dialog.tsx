import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
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
  const ZOOM_STEP = 0.25
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 3

  const safeIndex = useMemo(() => {
    if (!Number.isFinite(index) || images.length === 0) return 0
    return Math.min(images.length - 1, Math.max(0, index))
  }, [images.length, index])

  const current = images[safeIndex]
  const canNavigate = images.length > 1
  const [zoomScale, setZoomScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const dragStateRef = useRef<{
    active: boolean
    pointerId: number | null
    startX: number
    startY: number
    originX: number
    originY: number
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  const goPrev = useCallback(() => {
    if (!canNavigate) return
    onIndexChange((safeIndex - 1 + images.length) % images.length)
  }, [canNavigate, images.length, onIndexChange, safeIndex])

  const goNext = useCallback(() => {
    if (!canNavigate) return
    onIndexChange((safeIndex + 1) % images.length)
  }, [canNavigate, images.length, onIndexChange, safeIndex])

  const zoomOut = useCallback(() => {
    setZoomScale((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))))
  }, [])

  const zoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (!open) return
    setZoomScale(1)
    setOffset({ x: 0, y: 0 })
  }, [open, safeIndex])

  useEffect(() => {
    if (zoomScale > 1) return
    setOffset({ x: 0, y: 0 })
    setIsDraggingImage(false)
    dragStateRef.current.active = false
    dragStateRef.current.pointerId = null
  }, [zoomScale])

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
        return
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        zoomIn()
        return
      }
      if (e.key === "-") {
        e.preventDefault()
        zoomOut()
        return
      }
      if (e.key === "0") {
        e.preventDefault()
        resetZoom()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goPrev, onClose, open, resetZoom, zoomIn, zoomOut])

  if (!open || !current) return null

  const handleImagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
    setIsDraggingImage(true)
  }

  const handleImagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState.active || dragState.pointerId !== event.pointerId) return
    event.preventDefault()
    const deltaX = event.clientX - dragState.startX
    const deltaY = event.clientY - dragState.startY
    setOffset({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    })
  }

  const stopImageDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (dragState.pointerId !== event.pointerId) return
    dragStateRef.current.active = false
    dragStateRef.current.pointerId = null
    setIsDraggingImage(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

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
            <div className="editor-lightbox__zoom-controls">
              <button
                type="button"
                className="editor-lightbox__zoom-button"
                onClick={zoomOut}
                disabled={zoomScale <= MIN_ZOOM}
                aria-label="Thu nho anh"
              >
                <ZoomOut />
              </button>
              <span className="editor-lightbox__zoom-value">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                className="editor-lightbox__zoom-button"
                onClick={zoomIn}
                disabled={zoomScale >= MAX_ZOOM}
                aria-label="Phong to anh"
              >
                <ZoomIn />
              </button>
              <button
                type="button"
                className="editor-lightbox__zoom-button"
                onClick={resetZoom}
                disabled={zoomScale === 1}
                aria-label="Dat lai ty le anh"
              >
                <RotateCcw />
              </button>
            </div>
            <button
              type="button"
              className={cn("editor-lightbox__nav", "prev", !canNavigate && "is-disabled")}
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Ảnh trước"
            >
              <ChevronLeft />
            </button>

            <div
              className={cn(
                "editor-lightbox__image",
                zoomScale > 1 && "is-zoomable",
                isDraggingImage && "is-dragging",
              )}
              onPointerDown={handleImagePointerDown}
              onPointerMove={handleImagePointerMove}
              onPointerUp={stopImageDragging}
              onPointerCancel={stopImageDragging}
            >
              <img
                src={current.src}
                alt={current.altText || "image"}
                title={current.altText || "image"}
                className="editor-lightbox__image-content"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomScale})` }}
                draggable={false}
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
                    <img src={img.src} alt={img.altText || "image"} className="editor-lightbox__thumb-image" />
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

