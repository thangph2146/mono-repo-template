"use client"

import { useEffect, useRef } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot } from "lexical"
import type { SerializedEditorState } from "lexical"

export function EditorStateSyncPlugin({
  editorSerializedState,
}: {
  editorSerializedState?: SerializedEditorState
}) {
  const [editor] = useLexicalComposerContext()
  const lastHashRef = useRef<string | null>(null)

  useEffect(() => {
    const newHash = editorSerializedState
      ? JSON.stringify(editorSerializedState)
      : null

    if (newHash === lastHashRef.current) return
    lastHashRef.current = newHash

    const timer = setTimeout(() => {
      if (newHash) {
        editor.setEditorState(editor.parseEditorState(newHash))
      } else {
        editor.update(() => {
          $getRoot().clear()
        })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [editor, editorSerializedState])

  return null
}
