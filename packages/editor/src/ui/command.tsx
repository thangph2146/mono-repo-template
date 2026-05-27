import * as React from "react"
import { cn } from "../lib/utils"

export const Command = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("editor-command", className)} {...props} />
))
Command.displayName = "Command"

export const CommandList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("editor-command-list", className)} {...props} />
))
CommandList.displayName = "CommandList"

export const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("editor-command-group", className)} {...props} />
))
CommandGroup.displayName = "CommandGroup"

export const CommandItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onSelect?: () => void
    value?: string
  }
>(({ className, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("editor-command-item", className)}
    onClick={onSelect}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"
