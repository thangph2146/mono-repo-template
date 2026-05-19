import type { ReactNode } from "react"
import { ThemeProvider } from "@ui/components/theme-provider"
import { TextSizeProvider } from "@ui/components/text-size-provider"

export default function GraphLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TextSizeProvider>{children}</TextSizeProvider>
    </ThemeProvider>
  )
}
