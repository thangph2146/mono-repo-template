"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection"
import { $getSelection, $isRangeSelection, BaseSelection } from "lexical"
import { Minus, Plus } from "lucide-react"

import { useToolbarContext } from "../../context/toolbar-context"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { IconSize } from "../../ui/typography"

const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 1
const MAX_FONT_SIZE = 72
const HOLD_DELAY = 500
const HOLD_INTERVAL = 50

export function FontSizeToolbarPlugin() {
  const style = "font-size"
  const [fontSize, setFontSize] = useState<number | string>(DEFAULT_FONT_SIZE)
  const fontSizeRef = useRef(fontSize)

  // Update ref when state changes
  useEffect(() => {
    fontSizeRef.current = fontSize
  }, [fontSize])

  const { activeEditor } = useToolbarContext()

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      const value = $getSelectionStyleValueForProperty(
        selection,
        "font-size",
        `${DEFAULT_FONT_SIZE}px`
      )
      const size = parseInt(value) || DEFAULT_FONT_SIZE
      setFontSize(size)
    }
  }

  useUpdateToolbarHandler($updateToolbar)

  const updateFontSize = useCallback(
    (newSize: number) => {
      const size = Math.min(Math.max(newSize, MIN_FONT_SIZE), MAX_FONT_SIZE)
      activeEditor.update(() => {
        const selection = $getSelection()
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: `${size}px`,
          })
        }
      })
      setFontSize(size)
    },
    [activeEditor, style]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setFontSize("")
      return
    }
    const size = parseInt(value)
    if (!isNaN(size)) {
      setFontSize(size)
    }
  }

  const handleInputBlur = () => {
    if (fontSize === "" || (typeof fontSize === "number" && (fontSize < MIN_FONT_SIZE || fontSize > MAX_FONT_SIZE))) {
      setFontSize(DEFAULT_FONT_SIZE)
      updateFontSize(DEFAULT_FONT_SIZE)
    } else {
      updateFontSize(fontSize as number)
    }
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(
    (increment: boolean) => {
      stopTimer()

      // Initial click
      const currentSize = typeof fontSizeRef.current === "number" ? fontSizeRef.current : DEFAULT_FONT_SIZE
      updateFontSize(currentSize + (increment ? 1 : -1))

      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const currentSizeLoop = typeof fontSizeRef.current === "number" ? fontSizeRef.current : DEFAULT_FONT_SIZE
          if (increment && currentSizeLoop < MAX_FONT_SIZE) {
            updateFontSize(currentSizeLoop + 1)
          } else if (!increment && currentSizeLoop > MIN_FONT_SIZE) {
            updateFontSize(currentSizeLoop - 1)
          } else {
            stopTimer()
          }
        }, HOLD_INTERVAL)
      }, HOLD_DELAY)
    },
    [updateFontSize, stopTimer]
  )

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="editor-toolbar-item"
        onPointerDown={() => startTimer(false)}
        onPointerUp={stopTimer}
        onPointerLeave={stopTimer}
        disabled={typeof fontSize === "number" && fontSize <= MIN_FONT_SIZE}
        title="Decrease font size"
      >
        <IconSize size="xs">
          <Minus />
        </IconSize>
      </Button>
      <Input
        type="number"
        value={fontSize}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="editor-toolbar-item editor-toolbar-item--w-fit editor-toolbar-item--bg-background editor-toolbar-item--text-center editor-w-14"
        min={MIN_FONT_SIZE}
        max={MAX_FONT_SIZE}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            handleInputBlur()
          }
          event.stopPropagation()
        }}
      />
      <Button
        variant="outline"
        size="icon"
        className="editor-toolbar-item"
        onPointerDown={() => startTimer(true)}
        onPointerUp={stopTimer}
        onPointerLeave={stopTimer}
        disabled={typeof fontSize === "number" && fontSize >= MAX_FONT_SIZE}
        title="Increase font size"
      >
        <IconSize size="xs">
          <Plus />
        </IconSize>
      </Button>
    </>
  )
}
