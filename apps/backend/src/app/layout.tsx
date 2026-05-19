import type { Metadata } from "next"
import { Roboto, Roboto_Mono } from "next/font/google"
import "@ui/globals.css"
import "@thangph2146/lexical-editor/styles"
import { Toaster } from "sonner"
import NextTopLoader from "nextjs-toploader"
import { ThemeProvider } from "@ui/components/theme-provider"
import { TextSizeProvider } from "@ui/components/text-size-provider"
import { QueryProvider } from "@/providers/query-provider"
import { AuthProvider } from "@/providers/auth-provider"
import { AdminShell } from "@/components/admin-shell"

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  display: "swap",
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    template: "%s | Quản trị HUB Parent",
    default: "Quản trị HUB Parent",
  },
  description:
    "Cổng quản trị nội bộ cho hệ thống HUB Parent, hỗ trợ nhà trường quản lý nội dung, tài khoản, phân quyền, yêu cầu liên hệ và liên kết phụ huynh - sinh viên.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <NextTopLoader
          color="var(--primary)"
          showSpinner={false}
          shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
        />
        <ThemeProvider>
          <TextSizeProvider>
            <QueryProvider>
              <AuthProvider>
                <AdminShell isSidebar={true}>{children}</AdminShell>
              </AuthProvider>
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </TextSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
