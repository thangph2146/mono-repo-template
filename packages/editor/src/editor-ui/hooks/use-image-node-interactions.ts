"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  LexicalEditor,
  NodeKey,
  BaseSelection,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  SELECTION_CHANGE_COMMAND,
  CLICK_COMMAND,
  DRAGSTART_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  LexicalCommand,
} from "lexical"
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection"
import { mergeRegister } from "@lexical/utils"
import { $isImageNode } from "../../nodes/image-node"

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand("RIGHT_CLICK_IMAGE_COMMAND")

interface UseImageNodeInteractionsProps {
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>
  caption: LexicalEditor
  editor: LexicalEditor
  imageRef: React.MutableRefObject<HTMLImageElement | null>
  isResizing: boolean
  nodeKey: NodeKey
  showCaption: boolean
}

/**
 * Custom hook to handle interactions with the image node.
 * Handles selection, deletion, keyboard navigation, and context menu.
 */
export function useImageNodeInteractions({
  buttonRef,
  caption,
  editor,
  imageRef,
  isResizing,
  nodeKey,
  showCaption,
}: UseImageNodeInteractionsProps) {
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey)
  const activeEditorRef = useRef<LexicalEditor | null>(null)

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection()
      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isImageNode(node)) {
              node.remove()
            }
          })
        })
        return true
      }
      return false
    },
    [editor, isSelected]
  )

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection()
      const buttonElem = buttonRef.current
      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          $setSelection(null)
          event.preventDefault()
          caption.focus()
          return true
        } else if (
          buttonElem !== null &&
          buttonElem !== document.activeElement
        ) {
          event.preventDefault()
          buttonElem.focus()
          return true
        }
      }
      return false
    },
    [buttonRef, caption, isSelected, showCaption]
  )

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (
        activeEditorRef.current === caption ||
        buttonRef.current === event.target
      ) {
        $setSelection(null)
        editor.update(() => {
          setSelected(true)
          const parentRootElement = editor.getRootElement()
          if (parentRootElement !== null) {
            parentRootElement.focus()
          }
        })
        return true
      }
      return false
    },
    [buttonRef, caption, editor, setSelected]
  )

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload

      if (isResizing) {
        return true
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          clearSelection()
          setSelected(true)
        }
        return true
      }

      return false
    },
    [clearSelection, imageRef, isResizing, isSelected, setSelected]
  )

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      const domElement = event.target as HTMLElement | null
      if (domElement !== imageRef.current) {
        return
      }

      // Sync node selection before the context menu action runs so "Remove Link"
      // applies to the current image on the first click.
      clearSelection()
      setSelected(true)
      editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event)
    },
    [clearSelection, editor, imageRef, setSelected]
  )

  useEffect(() => {
    let isMounted = true
    const rootElement = editor.getRootElement()
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()))
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW
      )
    )

    rootElement?.addEventListener("contextmenu", onRightClick)

    return () => {
      isMounted = false
      unregister()
      rootElement?.removeEventListener("contextmenu", onRightClick)
    }
  }, [
    clearSelection,
    editor,
    imageRef,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    $onEnter,
    $onEscape,
    onClick,
    onRightClick,
    setSelected,
  ])

  return { isSelected, selection, setSelected, clearSelection }
}
