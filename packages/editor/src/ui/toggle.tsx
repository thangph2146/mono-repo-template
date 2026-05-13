import * as React from "react"
import { cn } from "../lib/utils"

export const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    pressed?: boolean
    onPressedChange?: (pressed: boolean) => void
    variant?: "default" | "outline" | "ghost"
    size?: "default" | "sm" | "lg"
  }
>(({ className, pressed, onPressedChange, variant = "default", size = "default", ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-pressed={pressed}
    data-state={pressed ? "on" : "off"}
    className={cn(
      "editor-toggle",
      variant !== "default" && `editor-toggle--${variant}`,
      size !== "default" && `editor-toggle--size-${size}`,
      className
    )}
    onClick={() => onPressedChange?.(!pressed)}
    {...props}
  />
))
Toggle.displayName = "Toggle"
