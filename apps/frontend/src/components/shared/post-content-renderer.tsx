"use client";

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { SerializedEditorState } from "lexical";
import { ImageLightboxDialog, type LightboxImage } from "@thangph2146/lexical-editor";
import { Text } from "@ui/components/typography";

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
  caption?: {
    editorState?: {
      root?: {
        children?: SerializedNode[];
      };
    };
  };
  showCaption?: boolean;
};

const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 1 << 1;
const TEXT_FORMAT_STRIKETHROUGH = 1 << 2;
const TEXT_FORMAT_UNDERLINE = 1 << 3;
const TEXT_FORMAT_CODE = 1 << 4;
const TEXT_FORMAT_SUBSCRIPT = 1 << 5;
const TEXT_FORMAT_SUPERSCRIPT = 1 << 6;
const GENERIC_IMAGE_CAPTIONS = new Set([
  "image",
  "img",
  "photo",
  "hinh",
  "hinh anh",
  "anh",
  "hình",
  "hình ảnh",
  "ảnh",
]);

function normalizeImageCaption(value?: string | null): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  return GENERIC_IMAGE_CAPTIONS.has(normalized) ? "" : raw;
}

function flattenSerializedText(nodes: SerializedNode[]): string {
  const chunks: string[] = [];

  const visit = (node: SerializedNode) => {
    if (typeof node.text === "string") {
      const value = node.text.trim();
      if (value) chunks.push(value);
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      for (const child of node.children) visit(child);
    }
  };

  for (const node of nodes) visit(node);
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function extractImageCaption(node: SerializedNode): string {
  if (node.showCaption !== true) return "";
  const captionNodes = node.caption?.editorState?.root?.children;
  if (!Array.isArray(captionNodes) || captionNodes.length === 0) return "";
  return flattenSerializedText(captionNodes);
}

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
        altText: normalizeImageCaption(extractAttribute(tag, "alt")),
      } satisfies LightboxImage;
    })
    .filter((image): image is LightboxImage => image != null);
}

function collectSerializedImages(nodes: SerializedNode[], images: LightboxImage[] = []): LightboxImage[] {
  for (const node of nodes) {
    if (node.type === "image" && typeof node.src === "string" && node.src.trim()) {
      const captionText = extractImageCaption(node);
      images.push({
        key: `${images.length}-${node.src}`,
        src: node.src.trim(),
        altText: captionText || normalizeImageCaption(node.altText),
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

        const imageCaption = extractImageCaption(node) || normalizeImageCaption(node.altText);
        const imageAlt = normalizeImageCaption(node.altText) || imageCaption || "image";
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
            {imageCaption ? (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {imageCaption}
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
          <ImageLightboxDialog
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
            <ImageLightboxDialog
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
