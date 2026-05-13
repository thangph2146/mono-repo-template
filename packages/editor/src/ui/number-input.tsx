"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Input } from "./input"

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onValueChange, min = 0, max = 100, step = 1, unit = "px", className, ...props }, ref) => {
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null)
    const valueRef = React.useRef(value)

    // Sync ref with current value for interval closure
    React.useEffect(() => {
      valueRef.current = value
    }, [value])

    const updateValue = React.useCallback((delta: number) => {
      onValueChange(Math.min(Math.max(valueRef.current + delta, min), max))
    }, [onValueChange, min, max])

    const startLongPress = (delta: number) => {
      updateValue(delta)
      timerRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          updateValue(delta)
        }, 50)
      }, 300) // Reduced initial delay to 300ms
    }

    const stopLongPress = React.useCallback(() => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }, [])

    const handleBlur = () => {
      onValueChange(Math.min(Math.max(value, min), max))
    }

    React.useEffect(() => {
      return () => stopLongPress()
    }, [stopLongPress])

    return (
      <div className={cn("editor-number-input-container", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="editor-number-input-btn"
          onMouseDown={() => startLongPress(-step)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(-step)}
          onTouchEnd={stopLongPress}
          tabIndex={-1} // Prevent tabbing into buttons
        >
          <Minus size={14} />
        </Button>
        <div className="editor-number-input-wrapper">
          <Input
            {...props}
            ref={ref}
            type="number"
            value={value}
            onBlur={handleBlur}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val)) onValueChange(val)
              else onValueChange(0) // Default to 0 for invalid input while typing
            }}
            className="editor-number-input-field"
          />
          {unit && <span className="editor-number-input-unit">{unit}</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="editor-number-input-btn"
          onMouseDown={() => startLongPress(step)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(step)}
          onTouchEnd={stopLongPress}
          tabIndex={-1}
        >
          <Plus size={14} />
        </Button>
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"
