import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  modal?: boolean
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

export function Popover({ children, open: controlledOpen, defaultOpen = false, onOpenChange, modal = false }: { 
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const contextValue = React.useMemo(() => ({
    open, setOpen, triggerRef, modal
  }), [open, setOpen, modal])

  return (
    <PopoverContext.Provider value={contextValue}>
      {children}
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean, children: React.ReactNode, disabled?: boolean }) {
  const context = React.useContext(PopoverContext)
  if (!context) throw new Error("PopoverTrigger must be used within Popover")

  const { triggerRef, open, setOpen } = context

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(!open)
    if (React.isValidElement(children)) {
      (children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>).props.onClick?.(e)
    }
  }

  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line react-hooks/refs
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>, {
      ref: triggerRef,
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={handleClick}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}

export function PopoverContent({ children, className, align = "center", sideOffset = 4, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end", sideOffset?: number }) {
  const context = React.useContext(PopoverContext)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (context?.open && context.triggerRef.current) {
      const rect = context.triggerRef.current.getBoundingClientRect()
      // Simple positioning logic (bottom-center or bottom-left)
      // Real popover needs collision detection, but this is "lite"
      let left = rect.left
      if (align === "center") {
        left = rect.left + rect.width / 2 // Will need to subtract half content width after render
      } else if (align === "end") {
        left = rect.right 
      }
      
      setPosition({
        top: rect.bottom + window.scrollY + sideOffset,
        left: left + window.scrollX 
      })

      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node) && 
            !context.triggerRef.current?.contains(e.target as Node)) {
          context.setOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [context, context?.open, align, sideOffset])

  if (!context?.open) return null

  return createPortal(
    <div
      ref={contentRef}
      className={cn("editor-popover-content", className)}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 9999
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

export function PopoverPortal({ children, container }: { children: React.ReactNode, container?: HTMLElement | null }) {
  if (!container) return <>{children}</>
  return createPortal(children, container)
}
