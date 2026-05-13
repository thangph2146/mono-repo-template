"use client"

import { useCallback, useState } from "react"
import { Table2Icon } from "lucide-react"
import { $getSelection, type BaseSelection } from "lexical"

import { useToolbarContext } from "../../context/toolbar-context"
import { $getCurrentTableNode } from "./table-toolbar-utils"
import { useUpdateToolbarHandler } from "../../editor-hooks/use-update-toolbar"
import { Button } from "../../ui/button"
import { Flex } from "../../ui/flex"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Slider } from "../../ui/slider"
import { cn } from "../../lib/utils"

type TableWidthConfig =
  | { mode: "percent"; percent: number }
  | { mode: "px"; px: number }
  | { mode: "auto" | "fit-content" | "max-content" | "min-content" }

type TableWidthDialogInitial = {
  mode: TableWidthConfig["mode"]
  percent: number
  px: number
}

function TableWidthDialog({
  onClose,
  onApply,
  initial,
}: {
  onClose: () => void
  onApply: (config: TableWidthConfig) => void
  initial: TableWidthDialogInitial
}) {
  const [mode, setMode] = useState<TableWidthConfig["mode"]>(initial.mode)
  const [percent, setPercent] = useState(initial.percent)
  const [pxWidth, setPxWidth] = useState(initial.px)
  const safePercent = Number.isFinite(percent) ? Math.max(50, Math.min(100, percent)) : 100
  const safePxWidth = Number.isFinite(pxWidth) ? Math.max(240, Math.min(3000, pxWidth)) : 960

  const submit = () => {
    if (mode === "percent") {
      onApply({ mode, percent: safePercent })
    } else if (mode === "px") {
      onApply({ mode, px: safePxWidth })
    } else {
      onApply({ mode })
    }
    onClose()
  }

  return (
    <div className="editor-table-dialog">
      <Flex direction="column" gap={4}>
        <div className="editor-table-dialog__group">
          <Label>Kiểu width CSS</Label>
          <Flex gap={2} wrap="wrap">
            {[
              { key: "percent", label: "%" },
              { key: "px", label: "px" },
              { key: "auto", label: "auto" },
              { key: "fit-content", label: "fit-content" },
              { key: "max-content", label: "max-content" },
              { key: "min-content", label: "min-content" },
            ].map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={mode === item.key ? "default" : "outline"}
                className={cn(
                  "transition-all",
                  mode === item.key &&
                    "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
                )}
                onClick={() => setMode(item.key as TableWidthConfig["mode"])}
              >
                {item.label}
              </Button>
            ))}
          </Flex>
        </div>

        <div className="editor-table-dialog__group">
          {mode === "percent" && (
            <>
              <Flex align="center" justify="between">
                <Label htmlFor="table-width-percent">Độ rộng bảng (%)</Label>
                <span className="editor-text-sm editor-font-medium">{safePercent}%</span>
              </Flex>
              <Slider
                aria-label="Table width percentage"
                min={50}
                max={100}
                step={5}
                value={safePercent}
                onChange={(e) => setPercent(Number(e.target.value || 100))}
              />
              <Input
                id="table-width-percent"
                type="number"
                min={50}
                max={100}
                step={5}
                value={safePercent}
                onChange={(e) => setPercent(Number(e.target.value || 100))}
              />
            </>
          )}

          {mode === "px" && (
            <>
              <Flex align="center" justify="between">
                <Label htmlFor="table-width-px">Độ rộng bảng (px)</Label>
                <span className="editor-text-sm editor-font-medium">{safePxWidth}px</span>
              </Flex>
              <Input
                id="table-width-px"
                type="number"
                min={240}
                max={3000}
                step={10}
                value={safePxWidth}
                onChange={(e) => setPxWidth(Number(e.target.value || 960))}
              />
            </>
          )}
        </div>

        {mode === "percent" && (
          <Flex gap={2} wrap="wrap">
            {[100, 95, 90, 85, 80, 75, 70, 60, 50].map((value) => (
              <Button key={value} type="button" variant="outline" onClick={() => setPercent(value)}>
                {value}%
              </Button>
            ))}
          </Flex>
        )}

        <Flex gap={2}>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMode("percent")
              setPercent(100)
            }}
          >
            Reset mặc định
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50"
            onClick={submit}
          >
            Áp dụng và cân bằng cột
          </Button>
        </Flex>
      </Flex>
    </div>
  )
}

export function TableWidthToolbarPlugin() {
  const { activeEditor, showModal } = useToolbarContext()
  const getCurrentDialogInitial = (): TableWidthDialogInitial => {
    let result: TableWidthDialogInitial = { mode: "percent", percent: 100, px: 960 }

    activeEditor.getEditorState().read(() => {
      const selection = $getSelection()
      const tableNode = $getCurrentTableNode(selection)
      if (!tableNode) return

      const tableElement = activeEditor.getElementByKey(tableNode.getKey())
      if (!(tableElement instanceof HTMLTableElement)) return

      const storedMode = tableElement.dataset.tableWidthMode as TableWidthDialogInitial["mode"] | undefined
      const storedPercent = Number.parseFloat(tableElement.dataset.tableWidthPercent || "")
      const storedPx = Number.parseFloat(tableElement.dataset.tableWidthPx || "")

      if (
        storedMode === "percent" ||
        storedMode === "px" ||
        storedMode === "auto" ||
        storedMode === "fit-content" ||
        storedMode === "max-content" ||
        storedMode === "min-content"
      ) {
        result.mode = storedMode
      }
      if (Number.isFinite(storedPercent)) {
        result.percent = Math.max(50, Math.min(100, Math.round(storedPercent)))
      }
      if (Number.isFinite(storedPx)) {
        result.px = Math.max(240, Math.min(3000, Math.round(storedPx)))
      }

      const rawWidth = (tableElement.style.width || "").trim().toLowerCase()
      if (!rawWidth) return

      if (rawWidth.endsWith("%")) {
        const value = Number.parseFloat(rawWidth)
        if (Number.isFinite(value)) {
          result = { mode: "percent", percent: Math.max(50, Math.min(100, Math.round(value))), px: result.px }
        }
        return
      }

      if (rawWidth.endsWith("px")) {
        const value = Number.parseFloat(rawWidth)
        if (Number.isFinite(value)) {
          result = { mode: "px", percent: result.percent, px: Math.max(240, Math.min(3000, Math.round(value))) }
        }
        return
      }

      if (
        rawWidth === "auto" ||
        rawWidth === "fit-content" ||
        rawWidth === "max-content" ||
        rawWidth === "min-content"
      ) {
        result = { mode: rawWidth, percent: result.percent, px: result.px }
      }
    })

    return result
  }
  const [insideTable, setInsideTable] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const updateTableState = useCallback((selection: BaseSelection) => {
    setInsideTable($getCurrentTableNode(selection) !== null)
  }, [])

  useUpdateToolbarHandler(updateTableState)

  const applyTableWidth = (config: TableWidthConfig) => {
    activeEditor.update(() => {
      const selection = $getSelection()
      const tableNode = $getCurrentTableNode(selection)
      if (!tableNode) return

      const tableElement = activeEditor.getElementByKey(tableNode.getKey())
      if (!(tableElement instanceof HTMLTableElement)) return

      const container = tableElement.parentElement
      const containerWidth =
        container?.clientWidth ||
        activeEditor.getRootElement()?.clientWidth ||
        Math.round(tableElement.getBoundingClientRect().width)

      if (!containerWidth || containerWidth <= 0) return

      const colCount = tableNode.getColumnCount()
      if (!colCount || colCount <= 0) return

      let targetWidth = containerWidth
      if (config.mode === "percent") {
        targetWidth = Math.max(120, (containerWidth * Math.max(50, Math.min(100, config.percent))) / 100)
      } else if (config.mode === "px") {
        targetWidth = Math.max(120, Math.min(containerWidth, config.px))
      }
      const colWidth = Math.max(24, targetWidth / colCount)
      const nextColWidths = Array.from({ length: colCount }, () => colWidth)

      // Persist table width config for reopening dialog later.
      tableElement.dataset.tableWidthMode = config.mode
      if (config.mode === "percent") {
        const value = Math.max(50, Math.min(100, config.percent))
        tableElement.dataset.tableWidthPercent = String(value)
        tableElement.style.setProperty("width", `${value}%`, "important")
      } else if (config.mode === "px") {
        const value = Math.max(240, Math.min(3000, config.px))
        tableElement.dataset.tableWidthPx = String(value)
        tableElement.style.setProperty("width", `${value}px`, "important")
      } else {
        tableElement.style.setProperty("width", config.mode, "important")
      }
      tableElement.style.setProperty("max-width", "100%", "important")

      if (typeof (tableNode as unknown as { setColWidths?: (widths: number[]) => void }).setColWidths === "function") {
        ;(tableNode as unknown as { setColWidths: (widths: number[]) => void }).setColWidths(nextColWidths)
      } else {
        ;(tableNode as unknown as { __colWidths?: number[] }).__colWidths = nextColWidths
        ;(tableNode as unknown as { __widths?: number[] }).__widths = nextColWidths
        tableNode.markDirty()
      }

    })
  }

  if (!insideTable) return null

  return (
    <Button
      type="button"
      variant="ghost"
      title="Điều chỉnh độ rộng bảng"
      aria-label="Điều chỉnh độ rộng bảng"
      onClick={() => {
        const initial = getCurrentDialogInitial()
        setIsDialogOpen(true)
        showModal("Điều chỉnh bảng", (onClose) => (
          <TableWidthDialog
            onClose={() => {
              setIsDialogOpen(false)
              onClose()
            }}
            onApply={applyTableWidth}
            initial={initial}
          />
        ))
      }}
      className={cn(
        "editor-toolbar-item transition-all",
        isDialogOpen
          ? "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90"
          : "editor-btn--ghost hover:bg-muted/80"
      )}
    >
      <Table2Icon className="editor-icon-sm" />
    </Button>
  )
}

