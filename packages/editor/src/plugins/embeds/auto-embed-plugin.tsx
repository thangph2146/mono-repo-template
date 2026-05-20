"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX, useMemo, useState } from "react"
import {
  AutoEmbedOption,
  EmbedConfig,
  EmbedMatchResult,
  LexicalAutoEmbedPlugin,
  URL_MATCHER,
} from "@lexical/react/LexicalAutoEmbedPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalEditor } from "lexical"
import { TwitterIcon, YoutubeIcon } from "lucide-react"

import { useEditorModal } from "../../editor-hooks/use-modal"
import { INSERT_TWEET_COMMAND } from "./twitter-plugin"
import { INSERT_YOUTUBE_COMMAND } from "./youtube-plugin"
import { Button } from "../../ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../../ui/command"
import { DialogFooter } from "../../ui/dialog"
import { Input } from "../../ui/input"
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "../../ui/popover"
import { IconSize } from "../../ui/typography"

export interface CustomEmbedConfig extends EmbedConfig {
  // Human readable name of the embeded content e.g. Tweet or Google Map.
  contentName: string

  // Icon for display.
  icon?: JSX.Element

  // An example of a matching url https://twitter.com/jack/status/20
  exampleUrl: string

  // For extra searching.
  keywords: Array<string>

  // Embed a Project.
  description?: string
}

export const YoutubeEmbedConfig: CustomEmbedConfig = {
  contentName: "Youtube Video",

  exampleUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",

  // Icon for display.
  icon: (
    <IconSize size="sm">
      <YoutubeIcon />
    </IconSize>
  ),

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id)
  },

  keywords: ["youtube", "video"],

  // Determine if a given URL is a match and return url data.
  parseUrl: async (url: string) => {
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url)

    const id = match && match[2] && match[2].length === 11 ? match[2] : null

    if (id != null) {
      return {
        id,
        url,
      }
    }

    return null
  },

  type: "youtube-video",
}

export const TwitterEmbedConfig: CustomEmbedConfig = {
  // e.g. Tweet or Google Map.
  contentName: "Tweet",

  exampleUrl: "https://twitter.com/jack/status/20",

  // Icon for display.
  icon: (
    <IconSize size="sm">
      <TwitterIcon />
    </IconSize>
  ),

  // Create the Lexical embed node from the url data.
  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_TWEET_COMMAND, result.id)
  },

  // For extra searching.
  keywords: ["tweet", "twitter"],

  // Determine if a given URL is a match and return url data.
  parseUrl: (text: string) => {
    const match =
      /^https:\/\/(twitter|x)\.com\/(#!\/)?(\w+)\/status(es)*\/(\d+)/.exec(text)

    if (match != null && match[5]) {
      return {
        id: match[5],
        url: text,
      }
    }

    return null
  },

  type: "tweet",
}

export const EmbedConfigs = [TwitterEmbedConfig, YoutubeEmbedConfig]

const debounce = (callback: (text: string) => void, delay: number) => {
  let timeoutId: number
  return (text: string) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback(text)
    }, delay)
  }
}

// Dialog content component that doesn't depend on context
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
        const urlMatch = URL_MATCHER.exec(inputText)
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

// Wrapper that uses context for AutoEmbedPlugin
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

// Standalone version that doesn't use context (for toolbar usage)
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

export function AutoEmbedPlugin(): JSX.Element {
  const [modal, showModal] = useEditorModal()

  const openEmbedModal = (embedConfig: CustomEmbedConfig) => {
    showModal(`Embed ${embedConfig.contentName}`, (onClose) => (
      <AutoEmbedDialog embedConfig={embedConfig} onClose={onClose} />
    ))
  }

  const getMenuOptions = (
    activeEmbedConfig: CustomEmbedConfig,
    embedFn: () => void,
    dismissFn: () => void
  ) => {
    return [
      new AutoEmbedOption("Dismiss", {
        onSelect: dismissFn,
      }),
      new AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn,
      }),
    ]
  }

  return (
    <>
      {modal}
      <LexicalAutoEmbedPlugin<CustomEmbedConfig>
        embedConfigs={EmbedConfigs}
        onOpenEmbedModalForConfig={openEmbedModal}
        getMenuOptions={getMenuOptions}
        menuRenderFn={(
          anchorElementRef,
          {
            selectedIndex,
            options,
            selectOptionAndCleanUp,
            setHighlightedIndex,
          }
        ) => {
          void selectedIndex
          void setHighlightedIndex
          return anchorElementRef.current ? (
            <Popover open={true}>
              <PopoverPortal container={anchorElementRef.current}>
                <div className="editor-auto-embed-wrapper">
                  <PopoverTrigger>
                    <span className="sr-only">Open Menu</span>
                  </PopoverTrigger>
                  <PopoverContent
                    className="editor-auto-embed-menu"
                    align="start"
                  >
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {options.map((option) => (
                            <CommandItem
                              key={option.key}
                              value={option.title}
                              onSelect={() => {
                                selectOptionAndCleanUp(option)
                              }}
                              className="editor-flex-row-center"
                            >
                              {option.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </div>
              </PopoverPortal>
            </Popover>
          ) : null
        }}
      />
    </>
  )
}
