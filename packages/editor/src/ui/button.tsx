import * as React from "react"
import { cn } from "../lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
  size?: "default" | "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      type = "button",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        type={type}
        className={cn(
          "editor-btn",
          variant !== "default" && `editor-btn--${variant}`,
          size !== "default" && `editor-btn--size-${size}`,
          isLoading && "editor-btn--loading",
          className
        )}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <Loader2
            className="editor-btn__loader editor-animate-spin"
            size={16}
          />
        )}
        <span
          className={cn("editor-btn__content", isLoading && "editor-opacity-0")}
        >
          {children}
        </span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
