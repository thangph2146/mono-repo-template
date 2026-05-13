import * as React from "react"
import { cn } from "../lib/utils"

export const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    aria-orientation={orientation}
    className={cn(
      "editor-separator",
      `editor-separator--${orientation}`,
      className
    )}
    {...props}
  />
))
Separator.displayName = "Separator"
