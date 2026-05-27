import * as React from "react"
import { cn } from "../lib/utils"

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end" | "baseline" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  wrap?: "nowrap" | "wrap" | "wrap-reverse"
  gap?: number | string
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    { className, align, justify, direction, wrap, gap, style, ...props },
    ref
  ) => {
    const isStandardGap =
      typeof gap === "number" && [0.5, 1, 1.5, 2, 3, 4, 5].includes(gap)
    const gapClass = isStandardGap
      ? `editor-gap-${gap.toString().replace(".", "-")}`
      : undefined

    const gapStyle =
      !isStandardGap && typeof gap === "number"
        ? { gap: `${gap * 0.25}rem` }
        : !isStandardGap && typeof gap !== "undefined"
          ? { gap }
          : undefined

    return (
      <div
        ref={ref}
        className={cn(
          "editor-flex",
          align && `editor-items-${align}`,
          justify && `editor-justify-${justify}`,
          direction && `editor-flex-${direction}`,
          wrap && `editor-flex-${wrap}`,
          gapClass,
          className
        )}
        style={{ ...gapStyle, ...style }}
        {...props}
      />
    )
  }
)
Flex.displayName = "Flex"
