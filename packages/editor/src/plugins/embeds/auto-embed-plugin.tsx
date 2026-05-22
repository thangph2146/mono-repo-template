"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { JSX } from "react"
import {
  AutoEmbedOption,
  EmbedMatchResult,
  LexicalAutoEmbedPlugin,
} from "@lexical/react/LexicalAutoEmbedPlugin"
import type { LexicalEditor } from "lexical"
import { TwitterIcon, YoutubeIcon } from "lucide-react"

import { useEditorModal } from "../../editor-hooks/use-modal"
import { INSERT_TWEET_COMMAND } from "./twitter-plugin"
import { INSERT_YOUTUBE_COMMAND } from "./youtube-plugin"
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "../../ui/popover"
import { IconSize } from "../../ui/typography"
import { Command, CommandGroup, CommandItem, CommandList } from "../../ui/command"
import {
  AutoEmbedDialog,
  CustomEmbedConfig,
  EmbedConfigs,
  registerEmbedConfig,
} from "../../editor-ui/dialogs"

// Re-export for convenience
export {
  AutoEmbedDialog,
  AutoEmbedDialogStandalone,
} from "../../editor-ui/dialogs"
export type { CustomEmbedConfig } from "../../editor-ui/dialogs"

export const YoutubeEmbedConfig: CustomEmbedConfig = {
  contentName: "Youtube Video",

  exampleUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",

  icon: (
    <IconSize size="sm">
      <YoutubeIcon />
    </IconSize>
  ),

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id)
  },

  keywords: ["youtube", "video"],

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
  contentName: "Tweet",

  exampleUrl: "https://twitter.com/jack/status/20",

  icon: (
    <IconSize size="sm">
      <TwitterIcon />
    </IconSize>
  ),

  insertNode: (editor: LexicalEditor, result: EmbedMatchResult) => {
    editor.dispatchCommand(INSERT_TWEET_COMMAND, result.id)
  },

  keywords: ["tweet", "twitter"],

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

registerEmbedConfig(YoutubeEmbedConfig)
registerEmbedConfig(TwitterEmbedConfig)

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
