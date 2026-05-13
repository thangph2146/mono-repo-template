"use client";

import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SerializedEditorState } from "lexical";
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@ui/components/dialog";
import { Text } from "@ui/components/typography";
import { cn } from "@ui/lib/utils";

type LightboxImage = {
  key: string;
  src: string;
  altText: string;
};

type SerializedNode = {
  type?: string;
  children?: SerializedNode[];
  text?: string;
  format?: number | string;
  tag?: string;
  url?: string;
  rel?: string | null;
  target?: string | null;
  src?: string;
  altText?: string;
  width?: number | "inherit";
  height?: number | "inherit";
  listType?: "bullet" | "number" | "check";
  checked?: boolean;
  direction?: "ltr" | "rtl" | null;
};

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 1 << 1;
const TEXT_FORMAT_STRIKETHROUGH = 1 << 2;
const TEXT_FORMAT_UNDERLINE = 1 << 3;
const TEXT_FORMAT_CODE = 1 << 4;
const TEXT_FORMAT_SUBSCRIPT = 1 << 5;
const TEXT_FORMAT_SUPERSCRIPT = 1 << 6;

function isSerializedEditorState(value: unknown): value is SerializedEditorState {
  return (
    value !== null &&
    typeof value === "object" &&
    "root" in value &&
    value.root !== null &&
    typeof value.root === "object" &&
    "type" in (value.root as Record<string, unknown>) &&
    (value.root as Record<string, unknown>).type === "root"
  );
}

function parseSerializedEditorState(value: unknown): SerializedEditorState | null {
  if (isSerializedEditorState(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return isSerializedEditorState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractAttribute(tag: string, attribute: string): string {
  const doubleQuoteMatch = tag.match(new RegExp(`${attribute}="([^"]*)"`, "i"));
  if (doubleQuoteMatch) return doubleQuoteMatch[1] ?? "";

  const singleQuoteMatch = tag.match(new RegExp(`${attribute}='([^']*)'`, "i"));
  if (singleQuoteMatch) return singleQuoteMatch[1] ?? "";

  return "";
}

function collectHtmlImages(html: string): LightboxImage[] {
  const matches = html.match(/<img\b[^>]*>/gi) ?? [];

  return matches
    .map((tag, index) => {
      const src = extractAttribute(tag, "src").trim();
      if (!src) return null;

      return {
        key: `${index}-${src}`,
        src,
        altText: extractAttribute(tag, "alt").trim(),
      } satisfies LightboxImage;
    })
    .filter((image): image is LightboxImage => image != null);
}

function collectSerializedImages(nodes: SerializedNode[], images: LightboxImage[] = []): LightboxImage[] {
  for (const node of nodes) {
    if (node.type === "image" && typeof node.src === "string" && node.src.trim()) {
      images.push({
        key: `${images.length}-${node.src}`,
        src: node.src.trim(),
        altText: node.altText?.trim() ?? "",
      });
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      collectSerializedImages(node.children, images);
    }
  }

  return images;
}

function applyTextFormatting(node: SerializedNode, content: ReactNode): ReactNode {
  if (typeof node.format !== "number" || node.format === 0) return content;

  let formatted = content;

  if (node.format & TEXT_FORMAT_CODE) formatted = <code>{formatted}</code>;
  if (node.format & TEXT_FORMAT_BOLD) formatted = <strong>{formatted}</strong>;
  if (node.format & TEXT_FORMAT_ITALIC) formatted = <em>{formatted}</em>;
  if (node.format & TEXT_FORMAT_UNDERLINE) formatted = <u>{formatted}</u>;
  if (node.format & TEXT_FORMAT_STRIKETHROUGH) formatted = <s>{formatted}</s>;
  if (node.format & TEXT_FORMAT_SUBSCRIPT) formatted = <sub>{formatted}</sub>;
  if (node.format & TEXT_FORMAT_SUPERSCRIPT) formatted = <sup>{formatted}</sup>;

  return formatted;
}

function isBlockLevelSerializedNode(node: SerializedNode): boolean {
  switch (node.type) {
    case "heading":
    case "quote":
    case "list":
    case "listitem":
    case "image":
    case "paragraph":
      return true;
    default:
      return false;
  }
}

function nodeHasBlockDescendant(node: SerializedNode): boolean {
  if (!Array.isArray(node.children) || node.children.length === 0) return false;

  for (const child of node.children) {
    if (isBlockLevelSerializedNode(child)) return true;
    if (nodeHasBlockDescendant(child)) return true;
  }

  return false;
}

function renderSerializedNodes(
  nodes: SerializedNode[],
  options: {
    onImageClick: (src: string) => void;
  },
  keyPrefix = "node",
): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}-${node.type ?? "unknown"}`;
    const children = Array.isArray(node.children)
      ? renderSerializedNodes(node.children, options, key)
      : null;

    switch (node.type) {
      case "paragraph": {
        const rawChildren = Array.isArray(node.children) ? node.children : [];
        const paragraphBlocks: ReactNode[] = [];
        let inlineBuffer: SerializedNode[] = [];
        let paragraphIndex = 0;

        const flushInlineBuffer = () => {
          if (inlineBuffer.length === 0) return;

          const inlineNodes = renderSerializedNodes(
            inlineBuffer,
            options,
            `${key}-inline-${paragraphIndex}`,
          );
          paragraphBlocks.push(
            <p key={`${key}-p-${paragraphIndex}`} dir={node.direction ?? undefined} className="leading-7">
              {inlineNodes.length > 0 ? inlineNodes : <br />}
            </p>,
          );
          inlineBuffer = [];
          paragraphIndex += 1;
        };

        for (const childNode of rawChildren) {
          const shouldTreatAsBlock =
            isBlockLevelSerializedNode(childNode) ||
            (childNode.type === "link" && nodeHasBlockDescendant(childNode));

          if (shouldTreatAsBlock) {
            flushInlineBuffer();
            const [renderedBlock] = renderSerializedNodes(
              [childNode],
              options,
              `${key}-block-${paragraphIndex}`,
            );
            if (renderedBlock) {
              paragraphBlocks.push(renderedBlock);
              paragraphIndex += 1;
            }
            continue;
          }

          inlineBuffer.push(childNode);
        }

        flushInlineBuffer();

        if (paragraphBlocks.length === 0) {
          return (
            <p key={key} dir={node.direction ?? undefined} className="leading-7">
              <br />
            </p>
          );
        }

        if (paragraphBlocks.length === 1) {
          return <div key={key}>{paragraphBlocks[0]}</div>;
        }

        return (
          <div key={key} className="space-y-4">
            {paragraphBlocks}
          </div>
        );
      }
      case "heading": {
        const HeadingTag = (node.tag === "h1" || node.tag === "h2" || node.tag === "h3"
          ? node.tag
          : "h2") as "h1" | "h2" | "h3";
        const headingClassName =
          HeadingTag === "h1"
            ? "text-3xl font-bold"
            : HeadingTag === "h2"
              ? "text-2xl font-semibold"
              : "text-xl font-semibold";

        return (
          <HeadingTag key={key} dir={node.direction ?? undefined} className={headingClassName}>
            {children}
          </HeadingTag>
        );
      }
      case "quote":
        return (
          <blockquote
            key={key}
            className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground"
          >
            {children}
          </blockquote>
        );
      case "list": {
        const ListTag = node.listType === "number" ? "ol" : "ul";
        const listClassName =
          node.listType === "number"
            ? "list-decimal space-y-2 pl-6"
            : "list-disc space-y-2 pl-6";

        return (
          <ListTag key={key} className={listClassName}>
            {children}
          </ListTag>
        );
      }
      case "listitem":
        return (
          <li key={key} className="leading-7">
            {node.checked != null ? (
              <span className="mr-2 inline-flex text-muted-foreground">
                {node.checked ? "☑" : "☐"}
              </span>
            ) : null}
            {children}
          </li>
        );
      case "link":
        return (
          <a
            key={key}
            href={node.url}
            rel={node.rel ?? "noreferrer"}
            target={node.target ?? "_blank"}
            className="text-primary underline underline-offset-4"
          >
            {children}
          </a>
        );
      case "linebreak":
        return <br key={key} />;
      case "image": {
        const imageSrc = node.src?.trim();
        if (!imageSrc) return null;

        const imageAlt = node.altText?.trim() || "image";
        return (
          <figure key={key} className="my-4">
            <button
              type="button"
              className="block w-full cursor-zoom-in"
              onClick={() => options.onImageClick(imageSrc)}
            >
              <img
                src={imageSrc}
                alt={imageAlt}
                title={imageAlt}
                className="h-auto max-w-full rounded-lg"
              />
            </button>
            {node.altText?.trim() ? (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {node.altText.trim()}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      case "text":
        return <span key={key}>{applyTextFormatting(node, node.text ?? "")}</span>;
      default:
        return children ? <div key={key}>{children}</div> : null;
    }
  });
}

function PostImageLightbox({
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

  useEffect(() => {
    if (!open) return;
    setZoomScale(1);
    setOffset({ x: 0, y: 0 });
  }, [open, safeIndex]);

  useEffect(() => {
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
      <DialogContent className="editor-dialog-content--lightbox">
        <div className="editor-lightbox">
          <div className="editor-lightbox__stage px-12 md:px-14">
            <div className="absolute right-10 top-3 z-30 flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-2 py-1 text-xs text-white">
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
              className={cn("editor-lightbox__nav z-20", "prev", !canNavigate && "is-disabled")}
              onClick={goPrev}
              disabled={!canNavigate}
              aria-label="Anh truoc"
            >
              <ChevronLeft />
            </button>

            <div
              className={cn(
                "editor-lightbox__image mx-auto max-h-[calc(100%-1rem)] max-w-[calc(100%-5rem)] overflow-hidden md:max-w-[calc(100%-7rem)]",
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
              className={cn("editor-lightbox__nav z-20", "next", !canNavigate && "is-disabled")}
              onClick={goNext}
              disabled={!canNavigate}
              aria-label="Anh tiep theo"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="editor-lightbox__footer">
            <div className="editor-lightbox__meta">
              <span className="editor-lightbox__counter">
                {safeIndex + 1} / {images.length}
              </span>
              {current.altText ? (
                <span className="editor-lightbox__caption">{current.altText}</span>
              ) : null}
            </div>

            {images.length > 1 ? (
              <div className="editor-lightbox__thumbs" role="list">
                {images.map((image, imageIndex) => (
                  <button
                    key={image.key}
                    type="button"
                    className={cn(
                      "editor-lightbox__thumb",
                      imageIndex === safeIndex && "is-active",
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

export function PostContentRenderer({ content }: { content?: unknown | null }) {
  const editorState = parseSerializedEditorState(content);
  const htmlContent = typeof content === "string" ? content.trim() : "";
  const serializedNodes = useMemo<SerializedNode[]>(
    () =>
      Array.isArray((editorState?.root as { children?: SerializedNode[] } | undefined)?.children)
        ? ((editorState?.root as { children: SerializedNode[] }).children ?? [])
        : [],
    [editorState],
  );
  const serializedImages = useMemo(
    () => (serializedNodes.length > 0 ? collectSerializedImages(serializedNodes) : []),
    [serializedNodes],
  );
  const htmlImages = useMemo(
    () => (htmlContent && /<[^>]+>/.test(htmlContent) ? collectHtmlImages(htmlContent) : []),
    [htmlContent],
  );
  const [serializedLightbox, setSerializedLightbox] = useState<null | {
    images: LightboxImage[];
    index: number;
  }>(null);
  const [htmlLightbox, setHtmlLightbox] = useState<null | { images: LightboxImage[]; index: number }>(
    null,
  );

  const openSerializedImage = useCallback(
    (src: string) => {
      const index = serializedImages.findIndex((item) => item.src === src);
      if (index === -1) return;
      setSerializedLightbox({ images: serializedImages, index });
    },
    [serializedImages],
  );

  const handleHtmlImageClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (htmlImages.length === 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const image = target.closest("img");
      if (!(image instanceof HTMLImageElement)) return;

      const clickedSrc = image.getAttribute("src")?.trim() ?? "";
      if (!clickedSrc) return;

      const index = htmlImages.findIndex((item) => item.src === clickedSrc);
      if (index === -1) return;

      event.preventDefault();
      event.stopPropagation();
      setHtmlLightbox({ images: htmlImages, index });
    },
    [htmlImages],
  );

  if (serializedNodes.length > 0) {
    return (
      <>
        {renderSerializedNodes(serializedNodes, { onImageClick: openSerializedImage })}
        {serializedLightbox ? (
          <PostImageLightbox
            open={true}
            images={serializedLightbox.images}
            index={serializedLightbox.index}
            onIndexChange={(nextIndex) =>
              setSerializedLightbox((prev) => (prev ? { ...prev, index: nextIndex } : prev))
            }
            onClose={() => setSerializedLightbox(null)}
          />
        ) : null}
      </>
    );
  }

  if (typeof content === "string") {
    if (!htmlContent) {
      return <Text variant="body">Noi dung bai viet dang duoc cap nhat.</Text>;
    }
    if (/<[^>]+>/.test(htmlContent)) {
      return (
        <>
          <div
            className="space-y-4 leading-7 text-foreground [&_img]:h-auto [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-lg"
            onClick={handleHtmlImageClick}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {htmlLightbox ? (
            <PostImageLightbox
              open={true}
              images={htmlLightbox.images}
              index={htmlLightbox.index}
              onIndexChange={(nextIndex) =>
                setHtmlLightbox((prev) => (prev ? { ...prev, index: nextIndex } : prev))
              }
              onClose={() => setHtmlLightbox(null)}
            />
          ) : null}
        </>
      );
    }

    return <div className="whitespace-pre-wrap leading-7 text-foreground">{htmlContent}</div>;
  }

  return <Text variant="body">Noi dung bai viet dang duoc cap nhat.</Text>;
}
