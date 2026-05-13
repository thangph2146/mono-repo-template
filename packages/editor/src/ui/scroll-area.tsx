import * as React from "react"
import { cn } from "../lib/utils"

export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("editor-scroll-area-viewport", className)}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export const ScrollBar = () => null // No-op for now, or use custom scrollbar styles
