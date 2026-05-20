import * as React from "react"
import { cn } from "../lib/utils"

export const TooltipProvider = ({
  children,
}: {
  children: React.ReactNode
}) => <>{children}</>

export const Tooltip = ({
  children,
}: {
  children: React.ReactNode
  disableHoverableContent?: boolean
}) => <div className="editor-tooltip-group">{children}</div>

export const TooltipTrigger = ({
  asChild,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean
  children: React.ReactNode
}) => {
  const child = asChild ? React.Children.only(children) : children
  if (!React.isValidElement(child)) return null
  return React.cloneElement(
    child as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
    {
      ...props,
      className: cn(
        (child as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props
          .className,
        "editor-tooltip-trigger"
      ),
    }
  )
}

export const TooltipContent = ({
  children,
  className,
  side = "top",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "bottom" | "left" | "right"
}) => (
  <div
    className={cn(
      "editor-tooltip-content",
      `editor-tooltip-content--${side}`,
      className
    )}
    {...props}
  >
    {children}
  </div>
)
