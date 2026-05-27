"use client"

import { useEffect, useMemo, useState } from "react"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { editorTheme } from "../themes/editor-theme"
import { TooltipProvider } from "../ui/tooltip"

import { cn } from "../lib/utils"
import { logger } from "../lib/logger"
import { useElementSize } from "../hooks/use-element-size"
import { EditorContainerProvider } from "../context/editor-container-context"

function createEditorConfig(nodes: InitialConfigType["nodes"]) {
  return {
    namespace: "Editor",
    theme: editorTheme,
    nodes,
    onError: (error: Error) => {
      if (
        error?.message?.includes("TableObserver") &&
        error?.message?.includes("Expected to find TableElement in DOM")
      ) {
        return
      }
      logger.error("[Editor] Error:", error)
    },
  } satisfies Omit<InitialConfigType, "editable" | "editorState">
}

export function Editor({
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  readOnly = false,
  placeholder = "",
  stickyTop,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  readOnly?: boolean
  placeholder?: string
  stickyTop?: number
}) {
  const { ref: editorRef, width: editorWidth } =
    useElementSize<HTMLDivElement>()
  const editorMaxWidth = editorWidth || undefined

  const [config, setConfig] = useState<{
    nodes: InitialConfigType["nodes"]
    Plugins: React.ComponentType<{
      readOnly?: boolean
      placeholder?: string
      stickyTop?: number
    }>
  } | null>(null)

  useEffect(() => {
    Promise.all([
      import("./nodes").then((m) => m.nodes),
      import("./plugins").then((m) => ({ Plugins: m.Plugins })),
    ]).then(([nodes, { Plugins }]) => setConfig({ nodes, Plugins }))
  }, [])

  const editorConfig = useMemo(() => {
    if (!config || !config.nodes) return null

    const validNodes = config.nodes.filter((node) => {
      if (node === undefined) {
        console.error("[Editor] Found undefined node in config.nodes")
        return false
      }
      return true
    })

    return createEditorConfig(validNodes)
  }, [config])

  if (!config || !editorConfig) {
    return (
      <div className={cn("editor-loading-container")} id="editor-x">
        <div className="editor-loading-text">Đang tải editor...</div>
      </div>
    )
  }

  const { Plugins } = config

  return (
    <div
      ref={editorRef}
      className={cn(
        "editor-root-container lexical-editor-root",
        !readOnly && "editor-root-container--shadow"
      )}
      id="editor-x"
    >
      <EditorContainerProvider value={{ maxWidth: editorMaxWidth }}>
        <LexicalComposer
          initialConfig={{
            ...editorConfig,
            editable: !readOnly,
            ...(editorState ? { editorState } : {}),
            ...(editorSerializedState
              ? { editorState: JSON.stringify(editorSerializedState) }
              : {}),
          }}
        >
          <TooltipProvider>
            <Plugins
              readOnly={readOnly}
              placeholder={placeholder}
              stickyTop={stickyTop}
            />

            {!readOnly && (
              <OnChangePlugin
                ignoreSelectionChange={true}
                onChange={(editorState) => {
                  onChange?.(editorState)
                  onSerializedChange?.(editorState.toJSON())
                }}
              />
            )}
          </TooltipProvider>
        </LexicalComposer>
      </EditorContainerProvider>
    </div>
  )
}
