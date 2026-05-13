import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"

interface SelectContextValue {
  value: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  disabled?: boolean
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export interface SelectProps {
  value: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
  modal?: boolean
}

export function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const contextValue = React.useMemo(() => ({
    value, onValueChange, open, setOpen, triggerRef, disabled
  }), [value, onValueChange, open, setOpen, disabled])

  return (
    <SelectContext.Provider value={contextValue}>
      {children}
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm" | "lg" | "icon"
}

export function SelectTrigger({ className, children, size = "default", ...props }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used within Select")

  const { triggerRef, disabled, open, setOpen } = context

  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        "editor-select", 
        size !== "default" && `editor-select--size-${size}`,
        className
      )}
      aria-expanded={open}
      aria-haspopup="listbox"
      data-state={open ? "open" : "closed"}
      onClick={() => !disabled && setOpen(!open)}
      disabled={disabled || props.disabled}
      {...props}
    >
      {children}
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="editor-select-icon">
        <path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
      </svg>
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used within Select")
  
  return <span>{context.value || placeholder}</span>
}

export function SelectContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(SelectContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (context?.open && context.triggerRef.current) {
      const rect = context.triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })

      // Simple click outside for portal
      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node) && 
            !context.triggerRef.current?.contains(e.target as Node)) {
          context.setOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [context, context?.open, context?.triggerRef, context?.setOpen])

  if (!context?.open) return null

  return createPortal(
    <div
      ref={contentRef}
      className={cn("editor-popover-content", className)}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        minWidth: position.width,
        width: "auto", // allow wider
        padding: "4px",
        zIndex: 9999
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

export function SelectItem({ value, children, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used within Select")

  const isSelected = context.value === value

  return (
    <div
      className={cn(
        "editor-select-item",
        className
      )}
      data-selected={isSelected}
      onClick={() => {
        context.onValueChange?.(value)
        context.setOpen(false)
      }}
      {...props}
    >
      {isSelected && (
        <span className="editor-select-item__check">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="editor-icon-sm">
            <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
        </span>
      )}
      {children}
    </div>
  )
}

export function SelectGroup({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="group" className={className} {...props}>
      {children}
    </div>
  )
}

export function SelectLabel({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("editor-select-label", className)} {...props}>
      {children}
    </div>
  )
}
