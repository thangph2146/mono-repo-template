import { cn } from "../lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "main" | "section" | "article"
  variant?: "page" | "card" | "popover" | "transparent"
}

export function Shell({
  as: Tag = "div",
  variant = "page",
  className,
  children,
  ...props
}: ShellProps) {
  const variantStyles = {
    page: "bg-background text-foreground",
    card: "bg-card text-card-foreground border border-border rounded-lg",
    popover:
      "bg-popover text-popover-foreground border border-border rounded-lg shadow-2",
    transparent: "",
  }

  return (
    <Tag className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </Tag>
  )
}
