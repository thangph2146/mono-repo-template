import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"
import { cn } from "../lib/utils"

type Props = {
  placeholder?: string
  className?: string
  placeholderClassName?: string
  /** Khi true (mặc định), thêm class nền `.editor-placeholder` (padding/vị trí mặc định). */
  placeholderDefaults?: boolean
}

export function ContentEditable({
  placeholder = "",
  className,
  placeholderClassName,
  placeholderDefaults = true,
}: Props): JSX.Element {
  const isReadOnlyOrReview =
    className?.includes("--readonly") || className?.includes("--review")

  const text = placeholder.trim()
  const showLexicalPlaceholder = text.length > 0

  return (
    <LexicalContentEditable
      className={cn(
        "ContentEditable__root relative block focus:outline-none",
        !isReadOnlyOrReview && "min-h-72",
        !isReadOnlyOrReview && "editor-p-2",
        className
      )}
      aria-label={"Editor nội dung"}
      {...(showLexicalPlaceholder
        ? {
            "aria-placeholder": text,
            placeholder: (
              <div
                className={cn(
                  placeholderDefaults && "editor-placeholder",
                  placeholderClassName
                )}
              >
                {text}
              </div>
            ),
          }
        : { placeholder: null })}
    />
  )
}
