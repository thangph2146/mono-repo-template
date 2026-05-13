import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export function Dialog({ open = false, onOpenChange = () => {}, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ asChild, children, className, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean, children: React.ReactNode }) {
  const context = React.useContext(DialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    context?.onOpenChange(true)
    if (React.isValidElement(children)) {
      (children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>).props.onClick?.(e)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button type="button" onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  )
}

export function DialogClose({ asChild, children, className, ...props }: React.HTMLAttributes<HTMLElement> & { asChild?: boolean, children: React.ReactNode }) {
  const context = React.useContext(DialogContext)
  
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    context?.onOpenChange(false)
    if (React.isValidElement(children)) {
      (children as React.ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>).props.onClick?.(e)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: handleClick,
      ...props
    })
  }

  return (
    <button type="button" onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  )
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  disableOutsideClick?: boolean
}

export function DialogContent({ children, className, disableOutsideClick, ...props }: DialogContentProps) {
  const context = React.useContext(DialogContext)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !context?.open) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableOutsideClick) {
      context.onOpenChange(false)
    }
  }

  const content = (
    <div 
      className="editor-dialog-overlay" 
      data-state="open"
      onClick={handleOverlayClick}
    >
      <div 
        className={cn("editor-dialog-content", className)} 
        data-state="open"
        {...props}
      >
        {children}
        <button 
          type="button"
          className="editor-dialog-content__close" 
          onClick={() => context.onOpenChange(false)}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="editor-icon-sm">
            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
          </svg>
          <span className="editor-sr-only">Close</span>
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("editor-dialog-header", className)} {...props} />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("editor-dialog-footer", className)} {...props} />
  )
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("editor-dialog-header__title", className)} {...props} />
  )
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("editor-dialog-header__description", className)} {...props} />
  )
}
