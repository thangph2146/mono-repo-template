import * as React from "react"
import { cn } from "../lib/utils"

type ToggleGroupContextValue = {
  type: "single" | "multiple"
  value: string | string[]
  onValueChange: (value: string | string[]) => void
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline"
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null)

type ToggleGroupProps = (
  | { type: "single"; value?: string; onValueChange?: (value: string) => void }
  | { type: "multiple"; value?: string[]; onValueChange?: (value: string[]) => void }
) & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline"
}

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = "single", value, onValueChange, children, size, variant, ...props }, ref) => {
    const contextValue: ToggleGroupContextValue = React.useMemo(() => ({
      type: type as "single" | "multiple",
      value: value || (type === "multiple" ? [] : ""),
      onValueChange: (val: string | string[]) => {
        if (type === "single" && typeof val === "string") {
          (onValueChange as ((v: string) => void))?.(val)
        } else if (type === "multiple" && Array.isArray(val)) {
          (onValueChange as ((v: string[]) => void))?.(val)
        }
      },
      size,
      variant
    }), [type, value, onValueChange, size, variant])

    return (
      <ToggleGroupContext.Provider value={contextValue}>
        <div ref={ref} className={cn("editor-toggle-group", className)} {...props}>
          {children}
        </div>
      </ToggleGroupContext.Provider>
    )
  }
)
ToggleGroup.displayName = "ToggleGroup"

export const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string, size?: "default" | "sm" | "lg", variant?: "default" | "outline" }
>(({ className, value, onClick, size: itemSize, variant: itemVariant, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  
  const size = itemSize || context?.size || "default"
  // variant is not used in styles yet but good to have in props
  
  if (!context) {
    // Fallback if used outside group
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "editor-toggle-group-item",
          size !== "default" && `editor-toggle-group-item--size-${size}`,
          className
        )}
        onClick={onClick}
        {...props}
      />
    )
  }

  const isSelected = context.type === "single" 
    ? context.value === value 
    : Array.isArray(context.value) && context.value.includes(value)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (context.type === "single") {
      context.onValueChange(isSelected ? "" : value)
    } else {
      const currentValues = Array.isArray(context.value) ? context.value : []
      const newValues = isSelected
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]
      context.onValueChange(newValues)
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={isSelected}
      data-state={isSelected ? "on" : "off"}
      className={cn(
        "editor-toggle-group-item",
        size !== "default" && `editor-toggle-group-item--size-${size}`,
        (itemVariant === "outline" || (!itemVariant && context?.variant === "outline")) && "editor-toggle-group-item--outline",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})
ToggleGroupItem.displayName = "ToggleGroupItem"
