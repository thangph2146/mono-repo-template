import * as React from "react"
import { cn } from "../lib/utils"

export const IconSize = ({ size = "medium", children, className }: { size?: "small" | "medium" | "large" | "sm" | "md" | "lg" | "xs" | "xl", children: React.ReactNode, className?: string }) => {
  const sizeMap: Record<string, string> = {
    xs: "editor-icon-xs",
    small: "editor-icon-sm",
    medium: "editor-icon-md",
    large: "editor-icon-lg",
    xl: "editor-icon-xl",
    sm: "editor-icon-sm",
    md: "editor-icon-md",
    lg: "editor-icon-lg",
  }
  
  if (React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      className: cn(sizeMap[size] || sizeMap.medium, (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.className, className)
    })
  }
  
  return <>{children}</>
}

export const TypographyP = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("editor-typography-p", className)} {...props} />
  )
)
TypographyP.displayName = "TypographyP"

export const TypographyPSmall = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("editor-typography-p-small", className)} {...props} />
  )
)
TypographyPSmall.displayName = "TypographyPSmall"

export const TypographySpanSmallMuted = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn("editor-typography-span-small-muted", className)} {...props} />
  )
)
TypographySpanSmallMuted.displayName = "TypographySpanSmallMuted"
