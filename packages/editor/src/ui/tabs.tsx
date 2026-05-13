import * as React from "react"
import { cn } from "../lib/utils"

const TabsContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "")
  const value = controlledValue ?? uncontrolledValue
  const setValue = onValueChange ?? setUncontrolledValue

  return (
    <TabsContext.Provider value={{ value, onValueChange: setValue }}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "editor-tabs-list",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  const isSelected = context?.value === value

  return (
    <button
      type="button"
      className={cn(
        "editor-tabs-trigger",
        className
      )}
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => context?.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(TabsContext)
  const isSelected = context?.value === value

  if (!isSelected) return null

  return (
    <div
      className={cn(
        "editor-tabs-content",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
