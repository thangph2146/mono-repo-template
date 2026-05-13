"use client";

import { cn } from "../lib/utils";

type FlexDirection = "row" | "col";
type FlexAlign = "start" | "center" | "end" | "between" | "around" | "evenly";
type FlexJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

const directionMap: Record<FlexDirection, string> = {
  row: "flex-row",
  col: "flex-col",
};

const alignMap: Record<FlexAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  between: "items-stretch",
  around: "items-stretch",
  evenly: "items-stretch",
};

const justifyMap: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: boolean;
  fullWidth?: boolean;
  shrink?: boolean;
  gap?: number;
}

export function Flex({
  as: Tag = "div",
  direction = "row",
  align,
  justify,
  wrap = false,
  fullWidth = false,
  shrink = true,
  gap,
  className,
  children,
  ...props
}: FlexProps) {
  const gapStyle = gap != null ? { gap: `${gap * 0.25}rem` } : undefined;

  return (
    <Tag
      className={cn(
        "flex",
        directionMap[direction],
        align ? alignMap[align] : undefined,
        justify ? justifyMap[justify] : undefined,
        wrap ? "flex-wrap" : undefined,
        fullWidth ? "w-full" : undefined,
        shrink ? "shrink" : "shrink-0",
        className
      )}
      style={gapStyle}
      {...props}
    >
      {children}
    </Tag>
  );
}
