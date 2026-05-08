"use client"

import * as React from "react"

import { cn } from "../lib/utils"

interface NativeScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollbarSize?: "sm" | "md" | "lg";
}

function NativeScrollArea({
  className,
  children,
  scrollbarSize = "md",
  ...props
}: NativeScrollAreaProps) {
  const sizeMap = {
    sm: 6,
    md: 8,
    lg: 12,
  }

  const size = sizeMap[scrollbarSize]

  return (
    <div
      data-slot="native-scroll-area"
      className={cn("overflow-y-auto overflow-x-hidden", className)}
      style={
        {
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-scrollbar) var(--color-scrollbar-track)",
        } as React.CSSProperties
      }
      {...props}
    >
      <style>{`
        [data-slot="native-scroll-area"]::-webkit-scrollbar {
          width: ${size}px;
        }
        [data-slot="native-scroll-area"]::-webkit-scrollbar-track {
          background: var(--color-scrollbar-track, transparent);
          border-radius: 999px;
        }
        [data-slot="native-scroll-area"]::-webkit-scrollbar-thumb {
          background: var(--color-scrollbar, var(--color-border));
          border-radius: 999px;
        }
        [data-slot="native-scroll-area"]::-webkit-scrollbar-thumb:hover {
          background: var(--color-scrollbar-hover, var(--color-muted-foreground));
        }
      `}</style>
      {children}
    </div>
  )
}

export { NativeScrollArea }
