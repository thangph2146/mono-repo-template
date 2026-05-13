import * as React from "react"
import { cn } from "../lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "editor-label",
      props["aria-disabled"] && "editor-label--disabled",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
