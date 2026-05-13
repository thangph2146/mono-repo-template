import * as React from "react"
import { LexicalEditor } from "lexical"
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { ContentEditable } from "./content-editable"

interface CaptionComposerProps {
  caption: LexicalEditor
  isEditable: boolean
}

/**
 * CaptionComposer - A nested editor for image captions.
 */
export function CaptionComposer({
  caption,
  isEditable,
}: CaptionComposerProps) {
  return (
    <LexicalNestedComposer initialEditor={caption}>
      <HistoryPlugin />
      <RichTextPlugin
        contentEditable={
          <div className="editor-relative">
            <ContentEditable
              className={`ImageNode__contentEditable editor-relative editor-block editor-min-h-5 editor-w-full editor-resize-none editor-border-0 editor-bg-transparent editor-p-2 editor-text-sm editor-whitespace-pre-wrap editor-outline-none editor-word-break-break-word ${
                isEditable
                  ? "editor-box-border editor-cursor-text editor-caret-primary editor-user-select-text"
                  : "editor-cursor-default editor-select-text"
              }`}
              placeholder={isEditable ? "Enter a caption..." : ""}
              placeholderDefaults={false}
              placeholderClassName="ImageNode__placeholder editor-absolute editor-top-0 editor-left-0 editor-overflow-hidden editor-p-2 editor-text-ellipsis editor-text-sm"
            />
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalNestedComposer>
  )
}
