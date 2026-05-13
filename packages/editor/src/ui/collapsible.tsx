import * as React from "react"
import { cn } from "../lib/utils"

const CollapsibleContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Collapsible({
  children,
  open: controlledOpen,
  onOpenChange,
  className,
  ...props
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <div className={cn("editor-collapsible", className)} data-state={open ? "open" : "closed"} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ children, asChild, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean, children: React.ReactNode }) {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error("CollapsibleTrigger must be used within Collapsible")

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    context.setOpen(!context.open)
    if (React.isValidElement(children)) {
      (children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>).props.onClick?.(e)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, { onClick: handleClick, ...props })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

export function CollapsibleContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(CollapsibleContext)
  if (!context) throw new Error("CollapsibleContent must be used within Collapsible")

  if (!context.open) return null

  return (
    <div className={cn("editor-overflow-hidden", className)} {...props}>
      {children}
    </div>
  )
}
