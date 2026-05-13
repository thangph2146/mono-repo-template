import * as React from "react"
import { cn } from "../lib/utils"

export function ButtonGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("editor-button-group", className)} {...props}>
      {children}
    </div>
  )
}
