"use client"
import { useState } from "react"
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin"
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"

import { ContentEditable } from "../editor-ui/content-editable"
import { cn } from "../lib/utils"
import { ActionsPlugin } from "../plugins/actions/actions-plugin"
import { AlignPlugin } from "../plugins/align-plugin"
import { CounterCharacterPlugin } from "../plugins/actions/counter-character-plugin"
import { ComponentPickerMenuPlugin } from "../plugins/component-picker-menu-plugin"
import { ContextMenuPlugin } from "../plugins/context-menu-plugin"
import { DragDropPastePlugin } from "../plugins/drag-drop-paste-plugin"
import { DraggableBlockPlugin } from "../plugins/draggable-block-plugin"
import { AutoEmbedPlugin } from "../plugins/embeds/auto-embed-plugin"
import { TwitterPlugin } from "../plugins/embeds/twitter-plugin"
import { YouTubePlugin } from "../plugins/embeds/youtube-plugin"
import { EmojiPickerPlugin } from "../plugins/emoji-picker-plugin"
import { FloatingLinkEditorPlugin } from "../plugins/floating-link-editor-plugin"
import { FloatingTextFormatToolbarPlugin } from "../plugins/floating-text-format-plugin"
import { ImagesPlugin } from "../plugins/images-plugin"
import {
  LIST_TOOLBAR_BULLET_MARKER_ITEMS,
} from "../config/editor-list-config"
import { ListFormatDropDown, ListLevelDropDown } from "../plugins/list/list-format-toolbar-dropdown"
import { LinkPlugin } from "../plugins/link-plugin"
import { EditorListPlugins } from "../plugins/list/editor-list-plugins"
import { MentionsPlugin } from "../plugins/mentions-plugin"
import { AlignmentPickerPlugin } from "../plugins/picker/alignment-picker-plugin"
import { BulletedListPickerPlugin } from "../plugins/picker/bulleted-list-picker-plugin"
import { CheckListPickerPlugin } from "../plugins/picker/check-list-picker-plugin"
import { CodePickerPlugin } from "../plugins/picker/code-picker-plugin"
import { ColumnsLayoutPickerPlugin } from "../plugins/picker/columns-layout-picker-plugin"
import { DividerPickerPlugin } from "../plugins/picker/divider-picker-plugin"
import { EmbedsPickerPlugin } from "../plugins/picker/embeds-picker-plugin"
import { HeadingPickerPlugin } from "../plugins/picker/heading-picker-plugin"
import { ImagePickerPlugin } from "../plugins/picker/image-picker-plugin"
import { ParagraphPickerPlugin } from "../plugins/picker/paragraph-picker-plugin"
import { QuotePickerPlugin } from "../plugins/picker/quote-picker-plugin"
import {
  DynamicTablePickerPlugin,
  TablePickerPlugin,
} from "../plugins/picker/table-picker-plugin"
import { TabFocusPlugin } from "../plugins/tab-focus-plugin"
import { TableColumnResizerPlugin } from "../plugins/table-column-resizer-plugin"
import {
  InsertTableCommandPlugin,
} from "../plugins/table-plugin"
import { BlockFormatDropDown } from "../plugins/toolbar/block-format-toolbar-plugin"
import { FormatBulletedList } from "../plugins/toolbar/block-format/format-bulleted-list"
import { FormatCheckList } from "../plugins/toolbar/block-format/format-check-list"
import { FormatCodeBlock } from "../plugins/toolbar/block-format/format-code-block"
import { FormatHeading } from "../plugins/toolbar/block-format/format-heading"
import { FormatBulletMarker } from "../plugins/toolbar/block-format/format-bullet-marker"
import { FormatParagraph } from "../plugins/toolbar/block-format/format-paragraph"
import { FormatQuote } from "../plugins/toolbar/block-format/format-quote"
import { BlockInsertPlugin } from "../plugins/toolbar/block-insert-plugin"
import { InsertColumnsLayout } from "../plugins/toolbar/block-insert/insert-columns-layout"
import { InsertEmbeds } from "../plugins/toolbar/block-insert/insert-embeds"
import { InsertHorizontalRule } from "../plugins/toolbar/block-insert/insert-horizontal-rule"
import { InsertImage } from "../plugins/toolbar/block-insert/insert-image"
import { InsertTable } from "../plugins/toolbar/block-insert/insert-table"
import { ClearFormattingToolbarPlugin } from "../plugins/toolbar/clear-formatting-toolbar-plugin"
import { CodeLanguageToolbarPlugin } from "../plugins/toolbar/code-language-toolbar-plugin"
import { ElementFormatToolbarPlugin } from "../plugins/toolbar/element-format-toolbar-plugin"
import { NodeOptionsToolbarPlugin } from "../plugins/toolbar/node-options-toolbar-plugin"
import { FontBackgroundToolbarPlugin } from "../plugins/toolbar/font-background-toolbar-plugin"
import { FontColorToolbarPlugin } from "../plugins/toolbar/font-color-toolbar-plugin"
import { FontFamilyToolbarPlugin } from "../plugins/toolbar/font-family-toolbar-plugin"
import { FontFormatToolbarPlugin } from "../plugins/toolbar/font-format-toolbar-plugin"
import { FontSizeToolbarPlugin } from "../plugins/toolbar/font-size-toolbar-plugin"
import { HistoryToolbarPlugin } from "../plugins/toolbar/history-toolbar-plugin"
import { LinkToolbarPlugin } from "../plugins/toolbar/link-toolbar-plugin"
import { SubSuperToolbarPlugin } from "../plugins/toolbar/subsuper-toolbar-plugin"
import { TableActionsToolbarPlugin } from "../plugins/toolbar/table-actions-toolbar-plugin"
import { TableWidthToolbarPlugin } from "../plugins/toolbar/table-width-toolbar-plugin"
import { ToolbarPlugin } from "../plugins/toolbar/toolbar-plugin"
import { TypingPerfPlugin } from "../plugins/typing-pref-plugin"
import { Separator } from "../ui/separator"
import { Flex } from "../ui/flex"

export function Plugins({
  readOnly = false,
  placeholder = "",
  stickyTop,
}: {
  readOnly?: boolean
  placeholder?: string
  stickyTop?: number
}) {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)
  const [isLinkEditMode, setIsLinkEditMode] = useState<boolean>(false)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="editor-relative-full">
      {!readOnly && (
        <ToolbarPlugin
          className="editor-toolbar"
          stickyTop={stickyTop}
        >
          {({ blockType }) => (
            <>
              <div className="editor-toolbar-group">
                <HistoryToolbarPlugin />
              </div>
              <Separator orientation="vertical" className="editor-toolbar-separator" />
              {blockType !== "code" && (
                <>
                  <div className="editor-toolbar-group">
                    <BlockInsertPlugin>
                      <InsertColumnsLayout />
                      <InsertHorizontalRule />
                      <InsertImage />
                      <InsertTable />
                      <InsertEmbeds />
                    </BlockInsertPlugin>
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <BlockFormatDropDown>
                      <FormatParagraph />
                      <FormatHeading levels={["h1", "h2", "h3"]} />
                      <FormatCodeBlock />
                      <FormatQuote />
                    </BlockFormatDropDown>
                    <ListFormatDropDown>
                      <FormatBulletedList />
                      {LIST_TOOLBAR_BULLET_MARKER_ITEMS.map((item) => (
                        <FormatBulletMarker
                          key={item.blockFormatValue}
                          blockFormatValue={item.blockFormatValue}
                          listType={item.listType}
                          markerType={item.markerType}
                        />
                      ))}
                      <FormatCheckList />
                    </ListFormatDropDown>
                    <ListLevelDropDown />
                    <NodeOptionsToolbarPlugin />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                </>
              )}
              {blockType === "code" ? (
                <div className="editor-toolbar-group">
                  <CodeLanguageToolbarPlugin />
                </div>
              ) : (
                <>
                  <div className="editor-toolbar-group">
                    <FontFamilyToolbarPlugin />
                    <FontSizeToolbarPlugin />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <FontFormatToolbarPlugin />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <SubSuperToolbarPlugin />
                    <LinkToolbarPlugin setIsLinkEditMode={setIsLinkEditMode} />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <ClearFormattingToolbarPlugin />
                    <TableActionsToolbarPlugin />
                    <TableWidthToolbarPlugin />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <FontColorToolbarPlugin />
                    <FontBackgroundToolbarPlugin />
                  </div>
                  <Separator orientation="vertical" className="editor-toolbar-separator" />
                  <div className="editor-toolbar-group">
                    <ElementFormatToolbarPlugin />
                  </div>
                </>
              )}
            </>
          )}
        </ToolbarPlugin>
      )}

      <div className={cn("editor-relative-full")}>
        {/* AutoFocusPlugin removed to prevent auto-scroll on page load */}
        <RichTextPlugin
          contentEditable={
            <div className={cn("editor-relative-full")}>
              <div className={cn("editor-relative-full")} ref={onRef}>
                <ContentEditable
                  placeholder=""
                  className={cn(
                    "editor-content-editable",
                    readOnly && "editor-content-editable--readonly"
                  )}
                  placeholderClassName="editor-placeholder"
                  placeholderDefaults={false}
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
          placeholder={readOnly ? null : <div className="editor-placeholder">{placeholder}</div>}
        />

        <ClickableLinkPlugin />
        {!readOnly && (
          <>
            <AlignPlugin />
            <HorizontalRulePlugin />
            <TablePlugin
              hasHorizontalScroll={false}
              hasCellMerge
              hasCellBackgroundColor
              hasTabHandler
            />
            <InsertTableCommandPlugin />
            <TableColumnResizerPlugin anchorElem={floatingAnchorElem ?? document.body} />
            <EditorListPlugins />
            <TabIndentationPlugin />
            <HistoryPlugin />
          </>
        )}
        <HashtagPlugin />

        <MentionsPlugin />
        {!readOnly && <DraggableBlockPlugin anchorElem={floatingAnchorElem} />}
        {!readOnly && <ImagesPlugin />}

        {!readOnly && (
          <>
            <AutoEmbedPlugin />
            <TwitterPlugin />
            <YouTubePlugin />
          </>
        )}

        {!readOnly && (
          <>
            <TypingPerfPlugin />
            <TabFocusPlugin />
            <LinkPlugin />
            <ClearEditorPlugin />

            <ComponentPickerMenuPlugin
              baseOptions={[
                ParagraphPickerPlugin(),
                HeadingPickerPlugin({ n: 1 }),
                HeadingPickerPlugin({ n: 2 }),
                HeadingPickerPlugin({ n: 3 }),
                TablePickerPlugin(),
                CheckListPickerPlugin(),
                BulletedListPickerPlugin(),
                QuotePickerPlugin(),
                CodePickerPlugin(),
                ColumnsLayoutPickerPlugin(),
                DividerPickerPlugin(),
                EmbedsPickerPlugin({ embed: "tweet" }),
                EmbedsPickerPlugin({ embed: "youtube-video" }),
                ImagePickerPlugin(),
                AlignmentPickerPlugin({ alignment: "left" }),
                AlignmentPickerPlugin({ alignment: "center" }),
                AlignmentPickerPlugin({ alignment: "right" }),
                AlignmentPickerPlugin({ alignment: "justify" }),
              ]}
              dynamicOptionsFn={DynamicTablePickerPlugin}
            />

            <ContextMenuPlugin />
            <DragDropPastePlugin />
            <EmojiPickerPlugin />

            <FloatingLinkEditorPlugin
              anchorElem={floatingAnchorElem}
              isLinkEditMode={isLinkEditMode}
              setIsLinkEditMode={setIsLinkEditMode}
            />
            <FloatingTextFormatToolbarPlugin
              anchorElem={floatingAnchorElem}
              setIsLinkEditMode={setIsLinkEditMode}
            />
          </>
        )}
      </div>
      {!readOnly && (
        <ActionsPlugin>
          <div className="editor-actions-bar">
            <Flex align="center" className="editor-flex-shrink-0">
              <CounterCharacterPlugin charset="UTF-16" />
            </Flex>
          </div>
        </ActionsPlugin>
      )}
    </div>
  )
}
