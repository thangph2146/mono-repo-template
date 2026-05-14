import type { Metadata } from "next"
import type { ReactNode } from "react"
import "@ui/globals.css"
import { ThemeProvider } from "@ui/components/theme-provider"
import { TextSizeProvider } from "@ui/components/text-size-provider"

export const metadata: Metadata = {
  title: "Sơ đồ mã nguồn HUB Parent",
  description:
    "Công cụ nội bộ để khám phá cấu trúc mã nguồn hệ thống HUB Parent bằng Graphify.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function GraphLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TextSizeProvider>{children}</TextSizeProvider>
    </ThemeProvider>
  )
}
