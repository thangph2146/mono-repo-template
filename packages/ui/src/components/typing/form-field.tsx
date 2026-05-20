"use client"

import type { ReactNode } from "react"
import { Label } from "../label"
import { cn } from "../../lib/utils"

export interface FormFieldColProps {
  label: string | ReactNode
  children: ReactNode
  description?: string
  required?: boolean
  className?: string
  labelClassName?: string
  contentClassName?: string
}

export function FormFieldCol({
  label,
  children,
  description,
  required,
  className,
  labelClassName,
  contentClassName,
}: FormFieldColProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      </div>
      <div className={cn(contentClassName)}>{children}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

export interface FormFieldRowProps {
  label: string | ReactNode
  children: ReactNode
  description?: string
  required?: boolean
  className?: string
  labelClassName?: string
  labelWidth?: string
  contentClassName?: string
}

export function FormFieldRow({
  label,
  children,
  description,
  required,
  className,
  labelClassName,
  labelWidth = "150px",
  contentClassName,
}: FormFieldRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4",
        className
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 sm:pt-1.5",
          labelWidth !== "auto" && `w-[${labelWidth}]`
        )}
        style={labelWidth !== "auto" ? { width: labelWidth } : undefined}
      >
        <Label className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn("min-w-0 flex-1", contentClassName)}>{children}</div>
    </div>
  )
}
