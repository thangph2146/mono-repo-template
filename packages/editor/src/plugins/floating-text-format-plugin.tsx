"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Dispatch, JSX, useCallback, useEffect, useRef, useState } from "react"
import * as React from "react"
import { $isCodeHighlightNode } from "@lexical/code"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { mergeRegister } from "@lexical/utils"
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  UnderlineIcon,
} from "lucide-react"
import { createPortal } from "react-dom"

import { getDOMRangeRect } from "../utils/get-dom-range-rect"
import { getSelectedNode } from "../utils/get-selected-node"
import { setFloatingElemPosition } from "../utils/set-floating-elem-position"
import { Button } from "../ui/button"
import { Flex } from "../ui/flex"
import { Separator } from "../ui/separator"
import {
  IconSize,
} from "../ui/typography"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"



function FloatingTextFormat({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isUnderline,
  isCode,
  isStrikethrough,
  isSubscript,
  isSuperscript,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor
  anchorElem: HTMLElement
  isBold: boolean
  isCode: boolean
  isItalic: boolean
  isLink: boolean
  isStrikethrough: boolean
  isSubscript: boolean
  isSuperscript: boolean
  isUnderline: boolean
  setIsLinkEditMode: Dispatch<boolean>
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null)

  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true)
    } else {
      setIsLinkEditMode(false)
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }, [editor, isLink, setIsLinkEditMode])

  useEffect(() => {
    function mouseMoveListener(e: MouseEvent) {
      if (
        popupCharStylesEditorRef?.current &&
        (e.buttons === 1 || e.buttons === 3)
      ) {
        if (popupCharStylesEditorRef.current.style.pointerEvents !== "none") {
          const x = e.clientX
          const y = e.clientY
          const elementUnderMouse = document.elementFromPoint(x, y)

          if (
            !popupCharStylesEditorRef.current.contains(elementUnderMouse)
          ) {
            // Mouse is not over the target element => not a normal click, but probably a drag
            popupCharStylesEditorRef.current.style.pointerEvents = "none"
          }
        }
      }
    }
    function mouseUpListener(_e: MouseEvent) {
      void _e
      if (popupCharStylesEditorRef?.current) {
        if (popupCharStylesEditorRef.current.style.pointerEvents !== "auto") {
          popupCharStylesEditorRef.current.style.pointerEvents = "auto"
        }
      }
    }

    if (popupCharStylesEditorRef?.current) {
      document.addEventListener("mousemove", mouseMoveListener)
      document.addEventListener("mouseup", mouseUpListener)

      return () => {
        document.removeEventListener("mousemove", mouseMoveListener)
        document.removeEventListener("mouseup", mouseUpListener)
      }
    }
  }, [popupCharStylesEditorRef])

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection()

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current
    const nativeSelection = window.getSelection()

    if (popupCharStylesEditorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement)

      setFloatingElemPosition(
        rangeRect,
        popupCharStylesEditorElem,
        anchorElem,
        isLink
      )
      popupCharStylesEditorElem.classList.add(
        "editor-floating-text-format--visible"
      )
    } else {
      setFloatingElemPosition(null, popupCharStylesEditorElem, anchorElem, isLink)
      popupCharStylesEditorElem.classList.remove(
        "editor-floating-text-format--visible"
      )
    }
  }, [editor, anchorElem, isLink])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar()
      })
    }

    window.addEventListener("resize", update)
    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update, { passive: true })
    }

    return () => {
      window.removeEventListener("resize", update)
      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update)
      }
    }
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem])

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar()
    })
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, $updateTextFormatFloatingToolbar])

  return (
    <div
      ref={popupCharStylesEditorRef}
      className="editor-floating-text-format"
    >
      {editor.isEditable() && (
        <Flex align="center" gap={1} className="editor-flex-nowrap">
          <div className="editor-floating-group editor-flex editor-items-center">
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isBold ? "on" : "off"}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
              }}
              aria-label="Toggle bold"
            >
              <IconSize size="sm">
                <BoldIcon />
              </IconSize>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isItalic ? "on" : "off"}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
              }}
              aria-label="Toggle italic"
            >
              <IconSize size="sm">
                <ItalicIcon />
              </IconSize>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isUnderline ? "on" : "off"}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")
              }}
              aria-label="Toggle underline"
            >
              <IconSize size="sm">
                <UnderlineIcon />
              </IconSize>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isStrikethrough ? "on" : "off"}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
              }}
              aria-label="Toggle strikethrough"
            >
              <IconSize size="sm">
                <StrikethroughIcon />
              </IconSize>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isCode ? "on" : "off"}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
              }}
              aria-label="Toggle code"
            >
              <IconSize size="sm">
                <CodeIcon />
              </IconSize>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="editor-toolbar-item"
              data-state={isLink ? "on" : "off"}
              onClick={insertLink}
              aria-label="Toggle link"
            >
              <IconSize size="sm">
                <LinkIcon />
              </IconSize>
            </Button>
          </div>

          <Separator orientation="vertical" className="editor-separator--vertical" />



          <div className="editor-floating-group editor-flex editor-items-center">
            <ToggleGroup
              type="single"
              className="editor-flex editor-items-center"
              value={
                isSubscript ? "subscript" : isSuperscript ? "superscript" : ""
              }
            >
              <ToggleGroupItem
                value="subscript"
                aria-label="Toggle subscript"
                className="editor-toolbar-item"
                onClick={() => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript")
                }}
                size="sm"
              >
                <IconSize size="sm">
                  <SubscriptIcon />
                </IconSize>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="superscript"
                aria-label="Toggle superscript"
                className="editor-toolbar-item"
                onClick={() => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript")
                }}
                size="sm"
              >
                <IconSize size="sm">
                  <SuperscriptIcon />
                </IconSize>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Flex>
      )}
    </div>
  )
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLDivElement | null,
  setIsLinkEditMode: Dispatch<boolean>
): JSX.Element | null {
  const [isText, setIsText] = useState(false)
  const [isLink, setIsLink] = useState(false)
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isSubscript, setIsSubscript] = useState(false)
  const [isSuperscript, setIsSuperscript] = useState(false)
  const [isCode, setIsCode] = useState(false)
  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return
      }
      const selection = $getSelection()
      const nativeSelection = window.getSelection()
      const rootElement = editor.getRootElement()

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false)
        return
      }

      if (!$isRangeSelection(selection)) {
        return
      }

      const node = getSelectedNode(selection)

      // Update text format
      setIsBold(selection.hasFormat("bold"))
      setIsItalic(selection.hasFormat("italic"))
      setIsUnderline(selection.hasFormat("underline"))
      setIsStrikethrough(selection.hasFormat("strikethrough"))
      setIsSubscript(selection.hasFormat("subscript"))
      setIsSuperscript(selection.hasFormat("superscript"))
      setIsCode(selection.hasFormat("code"))

      // Update links
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ""
      ) {
        setIsText($isTextNode(node) || $isParagraphNode(node))
      } else {
        setIsText(false)
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, "")
      if (!selection.isCollapsed() && rawTextContent === "") {
        setIsText(false)
        return
      }
    })
  }, [editor])

  useEffect(() => {
    document.addEventListener("selectionchange", updatePopup)
    return () => {
      document.removeEventListener("selectionchange", updatePopup)
    }
  }, [updatePopup])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup()
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false)
        }
      })
    )
  }, [editor, updatePopup])

  if (!isText || !anchorElem) {
    return null
  }

  return createPortal(
    <FloatingTextFormat
      editor={editor}
      anchorElem={anchorElem}
      isLink={isLink}
      isBold={isBold}
      isItalic={isItalic}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
      isCode={isCode}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem
  )
}

export function FloatingTextFormatToolbarPlugin({
  anchorElem,
  setIsLinkEditMode,
}: {
  anchorElem: HTMLDivElement | null
  setIsLinkEditMode: Dispatch<boolean>
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  const toolbar = useFloatingTextFormatToolbar(
    editor,
    anchorElem,
    setIsLinkEditMode
  )

  return <>{toolbar}</>
}
