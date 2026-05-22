"use client"

/**
 * Insert Layout Dialog Component
 *
 * Extracted from layout-plugin.tsx to avoid cross-plugin imports.
 * Consumed by: toolbar/block-insert, picker/columns-layout-picker, layout-plugin
 *
 * Design: Dialog accepts onSubmit callback instead of dispatching commands
 * directly, avoiding circular dependencies with layout-plugin.
 */
import * as React from "react"
import { JSX, useEffect, useRef, useState } from "react"

import { Button } from "../../ui/button"
import { NumberInput } from "../../ui/number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerPresets,
  ColorPickerTrigger,
} from "../color-picker"
import { Flex } from "../../ui/flex"
import { logger } from "../../lib/logger"

const LAYOUTS = [
  { label: "1 column", value: "1fr" },
  { label: "2 columns (equal width)", value: "1fr 1fr" },
  { label: "2 columns (75% - 25%)", value: "3fr 1fr" },
  { label: "2 columns (25% - 75%)", value: "1fr 3fr" },
  { label: "3 columns (equal width)", value: "1fr 1fr 1fr" },
  { label: "3 columns (25% - 50% - 25%)", value: "1fr 2fr 1fr" },
  { label: "4 columns (equal width)", value: "1fr 1fr 1fr 1fr" },
]

export type LayoutDialogValues = {
  template: string
  itemBackgroundColor: string
  itemPaddingXPx: number
  itemPaddingYPx: number
  itemBorderRadiusPx: number
}

export type InsertLayoutDialogProps = {
  onSubmit: (values: LayoutDialogValues) => void
  onClose: () => void
  initialValues?: Partial<LayoutDialogValues>
  submitLabel?: string
}

export function InsertLayoutDialog({
  onSubmit,
  onClose,
  initialValues,
  submitLabel = "Insert",
}: InsertLayoutDialogProps): JSX.Element {
  const [layout, setLayout] = useState(
    initialValues?.template ?? (LAYOUTS[0]?.value || "1fr")
  )
  const [backgroundColor, setBackgroundColor] = useState(
    initialValues?.itemBackgroundColor ?? "#ffffff"
  )
  const [paddingXPx, setPaddingXPx] = useState(
    initialValues?.itemPaddingXPx ?? 12
  )
  const [paddingYPx, setPaddingYPx] = useState(
    initialValues?.itemPaddingYPx ?? 12
  )
  const [borderRadiusPx, setBorderRadiusPx] = useState(
    initialValues?.itemBorderRadiusPx ?? 8
  )
  const layoutRef = useRef(layout)
  const backgroundColorRef = useRef(backgroundColor)
  const paddingXPxRef = useRef(paddingXPx)
  const paddingYPxRef = useRef(paddingYPx)
  const borderRadiusPxRef = useRef(borderRadiusPx)

  useEffect(() => {
    layoutRef.current = layout
  }, [layout])
  useEffect(() => {
    backgroundColorRef.current = backgroundColor
  }, [backgroundColor])
  useEffect(() => {
    paddingXPxRef.current = paddingXPx
  }, [paddingXPx])
  useEffect(() => {
    paddingYPxRef.current = paddingYPx
  }, [paddingYPx])
  useEffect(() => {
    borderRadiusPxRef.current = borderRadiusPx
  }, [borderRadiusPx])

  const onBackgroundColorChange = (value: string) => {
    backgroundColorRef.current = value
    setBackgroundColor(value)
  }

  const onPaddingXChange = (next: number) => {
    const value = Math.min(Math.max(next, 0), 64)
    paddingXPxRef.current = value
    setPaddingXPx(value)
  }

  const onPaddingYChange = (next: number) => {
    const value = Math.min(Math.max(next, 0), 64)
    paddingYPxRef.current = value
    setPaddingYPx(value)
  }

  const onBorderRadiusChange = (next: number) => {
    const value = Math.min(Math.max(next, 0), 64)
    borderRadiusPxRef.current = value
    setBorderRadiusPx(value)
  }

  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label

  const onClick = () => {
    const values: LayoutDialogValues = {
      template: layoutRef.current,
      itemBackgroundColor: backgroundColorRef.current,
      itemPaddingXPx: paddingXPxRef.current,
      itemPaddingYPx: paddingYPxRef.current,
      itemBorderRadiusPx: borderRadiusPxRef.current,
    }
    logger.info("[Layout] Submit dialog values", {
      mode: submitLabel,
      values,
    })
    onSubmit(values)
    onClose()
  }

  return (
    <Flex direction="column" gap={4}>
      <Select onValueChange={setLayout} value={layout}>
        <SelectTrigger className="editor-input-lg editor-w-full">
          <SelectValue placeholder={buttonLabel} />
        </SelectTrigger>
        <SelectContent className="editor-w-full">
          {LAYOUTS.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="editor-layout-dialog-grid">
        <Flex direction="column" gap={1.5}>
          <div className="editor-text-xs-muted">Background</div>
          <ColorPicker
            modal
            defaultFormat="hex"
            value={backgroundColor}
            onValueChange={onBackgroundColorChange}
          >
            <ColorPickerTrigger asChild>
              <Button variant="outline" className="editor-layout-color-trigger">
                <span
                  className="editor-layout-color-preview"
                  style={{ backgroundColor }}
                />
                <span>{backgroundColor.toUpperCase()}</span>
              </Button>
            </ColorPickerTrigger>
            <ColorPickerContent>
              <ColorPickerArea />
              <Flex align="center" gap={2}>
                <ColorPickerEyeDropper />
                <Flex direction="column" gap={2} className="editor-flex-1">
                  <ColorPickerHueSlider />
                  <ColorPickerAlphaSlider />
                </Flex>
              </Flex>
              <Flex align="center" gap={2}>
                <ColorPickerFormatSelect />
                <ColorPickerInput />
              </Flex>
              <ColorPickerPresets />
            </ColorPickerContent>
          </ColorPicker>
        </Flex>
        <Flex direction="column" gap={1.5}>
          <div className="editor-text-xs-muted">Padding X (px)</div>
          <NumberInput
            min={0}
            max={64}
            value={paddingXPx}
            onValueChange={onPaddingXChange}
          />
        </Flex>
        <Flex direction="column" gap={1.5}>
          <div className="editor-text-xs-muted">Padding Y (px)</div>
          <NumberInput
            min={0}
            max={64}
            value={paddingYPx}
            onValueChange={onPaddingYChange}
          />
        </Flex>
        <Flex direction="column" gap={1.5}>
          <div className="editor-text-xs-muted">Border radius (px)</div>
          <NumberInput
            min={0}
            max={64}
            value={borderRadiusPx}
            onValueChange={onBorderRadiusChange}
          />
        </Flex>
      </div>
      <Button onClick={onClick}>{submitLabel}</Button>
    </Flex>
  )
}
