"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX, useCallback, useEffect, useRef, useState } from "react"
import {
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CodeNode,
  getLanguageFriendlyName,
} from "@lexical/code"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNearestNodeFromDOMNode, $getNodeByKey, isHTMLElement } from "lexical"
import { createPortal } from "react-dom"

import { useDebounce } from "../editor-hooks/use-debounce"
import { CopyButton } from "../editor-ui/code-button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select"

const CODE_PADDING = 8

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = []

  for (const [lang, friendlyName] of Object.entries(
    CODE_LANGUAGE_FRIENDLY_NAME_MAP
  )) {
    options.push([lang, friendlyName])
  }

  return options
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

interface Position {
  top: string
  right: string
}

function CodeActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement
}): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const [lang, setLang] = useState("")
  const [nodeKey, setNodeKey] = useState<string | null>(null)
  const [isShown, setShown] = useState<boolean>(false)
  const [shouldListenMouseMove, setShouldListenMouseMove] =
    useState<boolean>(false)
  const [position, setPosition] = useState<Position>({
    right: "0",
    top: "0",
  })
  const codeSetRef = useRef<Set<string>>(new Set())
  const codeDOMNodeRef = useRef<HTMLElement | null>(null)

  function getCodeDOMNode(): HTMLElement | null {
    return codeDOMNodeRef.current
  }

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { codeDOMNode, isOutside } = getMouseInfo(event)
      if (isOutside) {
        setShown(false)
        return
      }

      if (!codeDOMNode) {
        return
      }

      codeDOMNodeRef.current = codeDOMNode

      let codeNode: CodeNode | null = null
      let _lang = ""
      let _nodeKey = ""

      editor.update(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode)

        if ($isCodeNode(maybeCodeNode)) {
          codeNode = maybeCodeNode
          _lang = codeNode.getLanguage() || ""
          _nodeKey = codeNode.getKey()
        }
      })

      if (codeNode) {
        const { y: editorElemY, right: editorElemRight } =
          anchorElem.getBoundingClientRect()
        const { y, right } = codeDOMNode.getBoundingClientRect()
        setLang(_lang)
        setNodeKey(_nodeKey)
        setShown(true)
        setPosition({
          right: `${editorElemRight - right + CODE_PADDING}px`,
          top: `${y - editorElemY + CODE_PADDING}px`,
        })
      }
    },
    50,
    1000
  )

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      editor.update(() => {
        if (nodeKey !== null) {
          const node = $getNodeByKey(nodeKey)
          if ($isCodeNode(node)) {
            node.setLanguage(value)
            setLang(value)
          }
        }
      })
    },
    [editor, nodeKey]
  )

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return
    }

    document.addEventListener("mousemove", debouncedOnMouseMove)

    return () => {
      setShown(false)
      debouncedOnMouseMove.cancel()
      document.removeEventListener("mousemove", debouncedOnMouseMove)
    }
  }, [shouldListenMouseMove, debouncedOnMouseMove])

  useEffect(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            switch (type) {
              case "created":
                codeSetRef.current.add(key)
                break

              case "destroyed":
                codeSetRef.current.delete(key)
                break

              default:
                break
            }
          }
        })
        setShouldListenMouseMove(codeSetRef.current.size > 0)
      },
      { skipInitialization: false }
    )
  }, [editor])

  return (
    <>
      {isShown ? (
        <div
          className="editor-code-action-menu"
          style={{ ...position, position: "absolute" }}
        >
          <Select
            modal={false}
            value={lang}
            onValueChange={onCodeLanguageSelect}
          >
            <SelectTrigger className="editor-code-action-menu__select">
              <span>{getLanguageFriendlyName(lang) || "Select Language"}</span>
            </SelectTrigger>
            <SelectContent className="editor-code-action-menu__select-content">
              {CODE_LANGUAGE_OPTIONS.map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="editor-code-action-menu__item"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="editor-code-action-menu__separator" />

          <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
        </div>
      ) : null}
    </>
  )
}

function getMouseInfo(event: MouseEvent): {
  codeDOMNode: HTMLElement | null
  isOutside: boolean
} {
  const target = event.target

  if (isHTMLElement(target)) {
    const codeDOMNode = target.closest<HTMLElement>(
      "code.editor-code"
    )
    const isOutside = !(
      codeDOMNode ||
      target.closest<HTMLElement>("div.editor-code-action-menu")
    )

    return { codeDOMNode, isOutside }
  } else {
    return { codeDOMNode: null, isOutside: true }
  }
}

export function CodeActionMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem: HTMLElement | null
}): React.ReactPortal | null {
  if (!anchorElem) {
    return null
  }

  return createPortal(
    <CodeActionMenuContainer anchorElem={anchorElem} />,
    anchorElem
  )
}
