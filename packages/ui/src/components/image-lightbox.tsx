"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "./dialog";
import { cn } from "../lib/utils";

export type LightboxImage = {
  key: string;
  src: string;
  altText: string;
};

export function ImageLightbox({
  open,
  images,
  index,
  onIndexChange,
  onClose,
}: {
  open: boolean;
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const ZOOM_STEP = 0.25;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const safeIndex = useMemo(() => {
    if (!Number.isFinite(index) || images.length === 0) return 0;
    return Math.min(images.length - 1, Math.max(0, index));
  }, [images.length, index]);

  const current = images[safeIndex];
  const canNavigate = images.length > 1;
  const [zoomScale, setZoomScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  const goPrev = useCallback(() => {
    if (!canNavigate) return;
    onIndexChange((safeIndex - 1 + images.length) % images.length);
  }, [canNavigate, images.length, onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    if (!canNavigate) return;
    onIndexChange((safeIndex + 1) % images.length);
  }, [canNavigate, images.length, onIndexChange, safeIndex]);

  const zoomOut = useCallback(() => {
    setZoomScale((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setZoomScale(1);
    setOffset({ x: 0, y: 0 });
  }, [open, safeIndex]);

  useLayoutEffect(() => {
    if (zoomScale > 1) return;
    setOffset({ x: 0, y: 0 });
    setIsDraggingImage(false);
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
  }, [zoomScale]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        zoomOut();
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, onClose, open, resetZoom, zoomIn, zoomOut]);

  if (!open || !current) return null;

  const handleImagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDraggingImage(true);
  };

  const handleImagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    setOffset({
      x: dragState.originX + deltaX,
      y: dragState.originY + deltaY,
    });
  };

  const stopImageDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState.pointerId !== event.pointerId) return;
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    setIsDraggingImage(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="h-[min(90vh,920px)] w-[min(1400px,96vw)] max-w-[min(1400px,96vw)] gap-0 overflow-hidden border-0 bg-[#0b0f19] p-0 text-white">
        <div className="flex h-full flex-col">
          <div className="relative flex flex-1 items-center justify-center bg-black/35 px-12 md:px-14">
            <div className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-2 py-1 text-xs text-white">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={zoomOut}
                disabled={zoomScale <= MIN_ZOOM}
                aria-label="Thu nho anh"
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="min-w-12 text-center font-medium">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={zoomIn}
                disabled={zoomScale >= MAX_ZOOM}
                aria-label="Phong to anh"
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={resetZoom}
                disabled={zoomScale === 1}
                aria-label="Dat lai ty le anh"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>

            <button
              type="button"
              className={cn("absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2", !canNavigate && "cursor-default opacity-45")}
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Anh truoc"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div
              className={cn(
                "mx-auto max-h-[calc(100%-1rem)] max-w-[calc(100%-5rem)] overflow-hidden md:max-w-[calc(100%-7rem)]",
                zoomScale > 1 ? (isDraggingImage ? "cursor-grabbing" : "cursor-grab") : "cursor-default",
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
                className="h-full w-full select-none object-contain transition-transform duration-150 ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomScale})` }}
                draggable={false}
              />
            </div>

            <button
              type="button"
              className={cn("absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2", !canNavigate && "cursor-default opacity-45")}
              onClick={goNext}
              disabled={!canNavigate}
              aria-label="Anh tiep theo"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="border-t border-white/15 px-3 pb-3 pt-2">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold opacity-90">
                {safeIndex + 1} / {images.length}
              </span>
              {current.altText ? (
                <span className="truncate text-right text-sm font-medium opacity-90">{current.altText}</span>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1" role="list">
                {images.map((image, imageIndex) => (
                  <button
                    key={image.key}
                    type="button"
                    className={cn(
                      "h-[52px] w-[72px] flex-none overflow-hidden rounded-lg border border-white/20 bg-white/5",
                      imageIndex === safeIndex && "border-white/70",
                    )}
                    onClick={() => onIndexChange(imageIndex)}
                    aria-label={`Chon anh ${imageIndex + 1}`}
                    role="listitem"
                  >
                    <img
                      src={image.src}
                      alt={image.altText || `Anh ${imageIndex + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
