import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { HashtagNode } from "@lexical/hashtag"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { ListNode, ListItemNode, type ListType } from "@lexical/list"
import { OverflowNode } from "@lexical/overflow"
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import {
  Klass,
  LexicalEditor,
  LexicalNode,
  LexicalNodeReplacement,
  ParagraphNode,
  TextNode,
} from "lexical"

import { AutocompleteNode } from "../nodes/autocomplete-node"
import { TweetNode } from "../nodes/embeds/tweet-node"
import { YouTubeNode } from "../nodes/embeds/youtube-node"
import { EmojiNode } from "../nodes/emoji-node"
import { ImageNode } from "../nodes/image-node"
import { KeywordNode } from "../nodes/keyword-node"
import { LayoutContainerNode } from "../nodes/layout-container-node"
import { LayoutItemNode } from "../nodes/layout-item-node"
import { ListWithColorNode } from "../nodes/list-with-color-node"
import { DownloadLinkNode } from "../nodes/download-link-node"
import { MentionNode } from "../nodes/mention-node"

/** Tạo ListWithColorNode dùng đúng class đã đăng ký trong editor (tránh type mismatch khi bundle trùng). */
export function createListWithColorNodeFromRegistry(
  editor: LexicalEditor,
  listType: ListType,
  start: number,
  sourceNode?: ListNode
): InstanceType<typeof ListWithColorNode> {
  const _editor = editor as unknown as { _nodes?: Map<string, { klass: Klass<LexicalNode> }> }
  const registeredNode = _editor._nodes?.get("listwithcolor")
  
  let newList: InstanceType<typeof ListWithColorNode>

  if (registeredNode && registeredNode.klass) {
    const Klass = registeredNode.klass as typeof ListWithColorNode
    newList = new Klass(listType, start) as InstanceType<typeof ListWithColorNode>
  } else {
    newList = new ListWithColorNode(listType, start)
  }

  if (sourceNode) {
    newList.setFormat(sourceNode.getFormatType())
    newList.setIndent(sourceNode.getIndent())
    newList.setDirection(sourceNode.getDirection())
  }

  return newList
}

export const nodes: ReadonlyArray<Klass<LexicalNode> | LexicalNodeReplacement> =
  [
    HeadingNode,
    ParagraphNode,
    TextNode,
    QuoteNode,
    ListNode,
    ListWithColorNode,
    ListItemNode,
    LinkNode,
    DownloadLinkNode,
    OverflowNode,
    HashtagNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    CodeNode,
    CodeHighlightNode,
    HorizontalRuleNode,
    MentionNode,
    ImageNode,
    EmojiNode,
    KeywordNode,
    LayoutContainerNode,
    LayoutItemNode,
    AutoLinkNode,
    TweetNode,
    YouTubeNode,
    AutocompleteNode,
  ]
