import {
  HEADING,
  QUOTE,
  CODE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  HIGHLIGHT,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK,
  INLINE_CODE,
} from "@lexical/markdown"

import { UNORDERED_LIST } from "./markdown-list-transformer"
import { ORDERED_LIST } from "./markdown-ordered-list-transformer"
import { CHECK_LIST } from "./markdown-checklist-transformer"
import { IMAGE } from "./markdown-image-transformer"
import { HR } from "./markdown-hr-transformer"
import { TABLE } from "./markdown-table-transformer"

export const MARKDOWN_TRANSFORMERS = [
  HEADING,
  QUOTE,
  CODE,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  IMAGE,
  HR,
  TABLE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  HIGHLIGHT,
  INLINE_CODE,
  LINK,
]
