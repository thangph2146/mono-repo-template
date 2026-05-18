import type { SerializedEditorState } from "lexical";
import type { SerializedLexicalNode } from "lexical";
import type {
  EditorParagraphNodeShape,
  EditorStateShape,
} from "./types";

export {
  slugify,
  formatDateTime,
  buildCategoryOptionTree,
  unwrapApiEnvelope as unwrapEnvelope,
  normalizePagedResult as normalizePaged,
  type CategoryTreeNode,
} from "@workspace/api-client";

export function createParagraphNode(text = ""): EditorParagraphNodeShape {
  return {
    children: text
      ? [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text,
            type: "text",
            version: 1,
          },
        ]
      : [],
    direction: null,
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    type: "paragraph",
    version: 1,
  };
}

export function createSerializedEditorState(
  paragraphs: EditorParagraphNodeShape[]
): SerializedEditorState {
  const state: EditorStateShape = {
    root: {
      children: paragraphs,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
  return state as SerializedEditorState;
}

export function getSeoStatus(
  length: number,
  recommendedMin: number,
  recommendedMax: number
) {
  if (length === 0) {
    return {
      label: "Chưa có nội dung",
      tone: "destructive" as const,
      hint: `Nên nhập khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  if (length < recommendedMin) {
    return {
      label: "Hơi ngắn",
      tone: "secondary" as const,
      hint: `Nên tăng lên khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  if (length > recommendedMax) {
    return {
      label: "Hơi dài",
      tone: "secondary" as const,
      hint: `Nên rút xuống khoảng ${recommendedMin}-${recommendedMax} ký tự.`,
    };
  }
  return {
    label: "Tốt cho SEO",
    tone: "default" as const,
    hint: `Độ dài đang nằm trong khoảng gợi ý ${recommendedMin}-${recommendedMax} ký tự.`,
  };
}

export function buildPostsFilterQuery(
  filters: { id: string; value: unknown }[]
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const filter of filters) {
    const { value } = filter;
    if (value === undefined || value === null || value === "") continue;

    if (filter.id === "published") {
      if (Array.isArray(value)) {
        const vals = value.map((v) => String(v)).filter(Boolean);
        if (vals.length) query.published = vals.join(",");
      } else {
        const v = String(value).trim();
        if (v) query.published = v;
      }
    } else if (filter.id === "categoryId") {
      if (Array.isArray(value)) {
        const vals = value.map((v) => String(v)).filter(Boolean);
        if (vals.length) query.categoryId = vals.join(",");
      } else if (typeof value === "string" && value.includes(",")) {
        const vals = value.split(",").map((v) => v.trim()).filter(Boolean);
        if (vals.length) query.categoryId = vals.join(",");
      } else {
        const v = String(value).trim();
        if (v) query.categoryId = v;
      }
    } else if (filter.id === "tagId") {
      if (Array.isArray(value)) {
        const vals = value.map((v) => String(v)).filter(Boolean);
        if (vals.length) query.tagId = vals.join(",");
      } else {
        const v = String(value).trim();
        if (v) query.tagId = v;
      }
    } else if (filter.id === "updatedAt") {
      const v = String(value).trim();
      if (v) query.updatedAt = v;
    }
  }
  return query;
}

export function isSerializedEditorState(
  value: unknown
): value is SerializedEditorState<SerializedLexicalNode> {
  return (
    typeof value === "object" &&
    value !== null &&
    "root" in value &&
    typeof (value as Record<string, unknown>).root === "object"
  );
}

export function fromLocalInputValue(value: string): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Ignore
  }
  return value;
}

export function toLocalInputValue(value: string): string {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  } catch {
    // Ignore
  }
  return value;
}

const EMPTY_EDITOR_PARAGRAPHS: EditorParagraphNodeShape[] = [createParagraphNode()];
const EMPTY_EDITOR_STATE = createSerializedEditorState(EMPTY_EDITOR_PARAGRAPHS);

function createEditorStateFromPlainText(raw: string): SerializedEditorState {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line, index, arr) => line !== "" || index < arr.length - 1);
  const paragraphs =
    lines.length > 0 ? lines.map((line) => createParagraphNode(line)) : EMPTY_EDITOR_PARAGRAPHS;

  return createSerializedEditorState(paragraphs);
}

export function normalizeContentForEditor(value: unknown): SerializedEditorState {
  if (isSerializedEditorState(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isSerializedEditorState(parsed)) {
          return parsed;
        }
      } catch {
        // Fallback to plain text import below.
      }
    }

    const plainText =
      typeof window !== "undefined" && /<[^>]+>/.test(value)
        ? new DOMParser().parseFromString(value, "text/html").body.textContent ?? value
        : value;
    return createEditorStateFromPlainText(plainText);
  }
  return EMPTY_EDITOR_STATE;
}
