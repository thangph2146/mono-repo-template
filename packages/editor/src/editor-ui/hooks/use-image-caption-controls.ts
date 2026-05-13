"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { LexicalEditor, NodeKey, $getNodeByKey, $getRoot } from "lexical"
import { $isImageNode } from "../../nodes/image-node"

interface UseImageCaptionControlsProps {
  caption: LexicalEditor
  editor: LexicalEditor
  nodeKey: NodeKey
  showCaption: boolean
}

type TimeoutHandle = ReturnType<typeof setTimeout>

/**
 * Custom hook to handle image caption logic.
 * Manages caption visibility and content synchronization.
 */
export function useImageCaptionControls({
  caption,
  editor,
  nodeKey,
  showCaption,
}: UseImageCaptionControlsProps) {
  const [hasCaptionContent, setHasCaptionContent] = useState(false)
  const [localShowCaption, setLocalShowCaption] = useState(showCaption)
  const isUpdatingCaptionRef = useRef(false)
  const lastShowCaptionRef = useRef(showCaption)

  useEffect(() => {
    let timeout: TimeoutHandle | null = null
    timeout = setTimeout(() => {
      if (!showCaption) {
        setHasCaptionContent(false)
        setLocalShowCaption(false)
      } else if (
        !isUpdatingCaptionRef.current &&
        lastShowCaptionRef.current !== showCaption
      ) {
        setLocalShowCaption(showCaption)
        lastShowCaptionRef.current = showCaption
      }
      isUpdatingCaptionRef.current = false
    }, 0)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [showCaption])

  const setShowCaption = useCallback(
    (show: boolean) => {
      isUpdatingCaptionRef.current = true
      lastShowCaptionRef.current = show

      setLocalShowCaption(show)

      if (!show) {
        setHasCaptionContent(false)
      }

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setShowCaption(show)

          if (!show) {
            caption.update(() => {
              const root = $getRoot()
              root.clear()
            })
          }
        }
      })
    },
    [caption, editor, nodeKey]
  )

  useEffect(() => {
    const computeHasContent = () => {
      const state = caption.getEditorState()
      const hasContent = state.read(() => {
        const root = $getRoot()
        const raw = root.getTextContent()
        const text = raw.replace(/[\u200B\u00A0\s]+/g, "")
        return text.length > 0
      })
      setHasCaptionContent(showCaption && hasContent)
    }

    const timer = setTimeout(() => {
      computeHasContent()
    }, 0)

    const unregister = caption.registerUpdateListener(() => {
      computeHasContent()
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          node.setShowCaption(showCaption)
        }
      })
    })

    return () => {
      clearTimeout(timer)
      unregister()
    }
  }, [caption, editor, nodeKey, showCaption])

  return {
    hasCaptionContent,
    localShowCaption,
    setShowCaption,
  }
}
