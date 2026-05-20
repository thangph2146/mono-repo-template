"use client"

import { useState, useEffect, useRef } from "react"
import { Editor } from "../editor-x/editor"
import type { SerializedEditorState } from "lexical"
import { logger } from "../lib/logger"
import { EditorUploadsProvider } from "../context/uploads-context"

export interface LexicalEditorProps {
  value?: unknown
  onChange?: (value: SerializedEditorState) => void
  readOnly?: boolean
  className?: string
  placeholder?: string
  uploadsContext?: import("../context/uploads-context").EditorUploadsContextType
  stickyTop?: number
}

function isValidSerializedEditorState(
  value: unknown
): value is SerializedEditorState {
  return (
    value !== null &&
    typeof value === "object" &&
    "root" in value &&
    value.root !== null &&
    typeof value.root === "object" &&
    "type" in (value.root as Record<string, unknown>) &&
    (value.root as Record<string, unknown>).type === "root"
  )
}

export function LexicalEditor({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder = "",
  uploadsContext,
  stickyTop,
}: LexicalEditorProps) {
  // Parse initial value as SerializedEditorState
  const [editorState, setEditorState] = useState<
    SerializedEditorState | undefined
  >(() => {
    if (value && typeof value === "object" && value !== null) {
      if (isValidSerializedEditorState(value)) {
        return value
      }
      return undefined
    }
    // If value is a JSON string, try to parse it
    if (typeof value === "string" && value.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(value)
        if (isValidSerializedEditorState(parsed)) {
          return parsed
        }
      } catch {
        // Invalid JSON, return undefined
      }
    }
    return undefined
  })

  // Ref to track if we are syncing from external value
  const isSyncingRef = useRef(false)
  const lastValueRef = useRef(value)

  // Ref to track current state for comparison
  const editorStateRef = useRef(editorState)
  useEffect(() => {
    editorStateRef.current = editorState
  }, [editorState])

  useEffect(() => {
    // Skip if value hasn't changed by reference
    if (value === lastValueRef.current && !isSyncingRef.current) return

    lastValueRef.current = value

    const syncState = (newState: SerializedEditorState | undefined) => {
      const currentStateStr = JSON.stringify(editorStateRef.current)
      const newStateStr = JSON.stringify(newState)

      if (currentStateStr !== newStateStr) {
        isSyncingRef.current = true
        setEditorState(newState)
        // Reset syncing flag in next tick
        setTimeout(() => {
          isSyncingRef.current = false
        }, 0)
      }
    }

    if (value && typeof value === "object" && value !== null) {
      if (isValidSerializedEditorState(value)) {
        syncState(value)
      } else {
        logger.error("[LexicalEditor] Invalid value object structure:", value)
      }
    } else if (typeof value === "string" && value.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(value)
        if (isValidSerializedEditorState(parsed)) {
          syncState(parsed)
        } else {
          logger.error("[LexicalEditor] Invalid parsed JSON structure:", parsed)
        }
      } catch (error) {
        logger.error("[LexicalEditor] Error parsing value string:", error)
      }
    } else if (value === null || value === undefined) {
      if (editorStateRef.current !== undefined) {
        syncState(undefined)
      }
    }
  }, [value]) // Only depend on value

  const handleSerializedChange = (newState: SerializedEditorState) => {
    if (readOnly) return

    // Avoid triggering update if state hasn't effectively changed (optional optimization)
    // But Lexical's onChange usually implies a change.

    // Update local state to avoid re-syncing from props immediately if parent re-renders
    // isSyncingRef.current = true
    setEditorState(newState)

    if (onChange) {
      onChange(newState)
    }

    // setTimeout(() => {
    //   isSyncingRef.current = false
    // }, 0)
  }

  const editorContent = (
    <Editor
      editorSerializedState={editorState}
      onSerializedChange={handleSerializedChange}
      readOnly={readOnly}
      placeholder={placeholder}
      stickyTop={stickyTop}
    />
  )

  return (
    <div className={className}>
      {uploadsContext ? (
        <EditorUploadsProvider value={uploadsContext}>
          {editorContent}
        </EditorUploadsProvider>
      ) : (
        editorContent
      )}
    </div>
  )
}
