"use client"

/**
 * Auto Embed Dialog Components
 *
 * Extracted from auto-embed-plugin.tsx to avoid cross-plugin imports.
 * Consumed by: toolbar/block-insert, picker/embeds-picker, auto-embed-plugin
 */
import { JSX, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { EmbedConfig, EmbedMatchResult } from "@lexical/react/LexicalAutoEmbedPlugin"
import type { LexicalEditor } from "lexical"

import { Button } from "../../ui/button"
import { DialogFooter } from "../../ui/dialog"
import { Input } from "../../ui/input"

export interface CustomEmbedConfig extends EmbedConfig {
  contentName: string
  icon?: JSX.Element
  exampleUrl: string
  keywords: Array<string>
  description?: string
}

const debounce = (callback: (text: string) => void, delay: number) => {
  let timeoutId: number
  return (text: string) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback(text)
    }, delay)
  }
}

// ─── Dialog Content ────────────────────────────────────────────────

function AutoEmbedDialogContent({
  embedConfig,
  onClose,
  editor,
}: {
  embedConfig: CustomEmbedConfig
  onClose: () => void
  editor: LexicalEditor
}): JSX.Element {
  const [text, setText] = useState("")
  const [embedResult, setEmbedResult] = useState<EmbedMatchResult | null>(null)

  const validateText = useMemo(
    () =>
      debounce((inputText: string) => {
        const urlMatch = /^((https?:\/\/)|(www\.))[^\s]+$/i.exec(inputText)
        if (embedConfig != null && inputText != null && urlMatch != null) {
          Promise.resolve(embedConfig.parseUrl(inputText)).then(
            (parseResult) => {
              setEmbedResult(parseResult)
            }
          )
        } else if (embedResult != null) {
          setEmbedResult(null)
        }
      }, 200),
    [embedConfig, embedResult]
  )

  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult)
      onClose()
    }
  }

  return (
    <div className="editor-flex-col-gap-4">
      <Input
        type="text"
        placeholder={embedConfig.exampleUrl}
        value={text}
        data-test-id={`${embedConfig.type}-embed-modal-url`}
        onChange={(e) => {
          const { value } = e.target
          setText(value)
          validateText(value)
        }}
      />
      <DialogFooter>
        <Button
          disabled={!embedResult}
          onClick={onClick}
          data-test-id={`${embedConfig.type}-embed-modal-submit-btn`}
        >
          Embed
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Standalone Dialog (for toolbar/picker usage) ──────────────────

export function AutoEmbedDialogStandalone({
  embedConfig,
  onClose,
  editor,
}: {
  embedConfig: CustomEmbedConfig
  onClose: () => void
  editor: LexicalEditor
}): JSX.Element {
  return (
    <AutoEmbedDialogContent
      embedConfig={embedConfig}
      onClose={onClose}
      editor={editor}
    />
  )
}

// ─── Context-based Dialog (for AutoEmbedPlugin usage) ──────────────

export function AutoEmbedDialog({
  embedConfig,
  onClose,
  editor,
}: {
  embedConfig: CustomEmbedConfig
  onClose: () => void
  editor?: LexicalEditor
}): JSX.Element {
  const [editorFromContext] = useLexicalComposerContext()
  const activeEditor = editor ?? editorFromContext

  return (
    <AutoEmbedDialogContent
      embedConfig={embedConfig}
      onClose={onClose}
      editor={activeEditor}
    />
  )
}

// ─── Embed Configs ─────────────────────────────────────────────────

export const EmbedConfigs: CustomEmbedConfig[] = []

export function registerEmbedConfig(config: CustomEmbedConfig): void {
  EmbedConfigs.push(config)
}

export function unregisterEmbedConfig(type: string): void {
  const idx = EmbedConfigs.findIndex((c) => c.type === type)
  if (idx >= 0) EmbedConfigs.splice(idx, 1)
}
