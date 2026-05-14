import type { Metadata } from "next"
import { Suspense } from "react"
import { Roboto, Roboto_Mono } from "next/font/google"
import "@ui/globals.css"
import "@thangph2146/lexical-editor/styles"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { ThemeProvider } from "@ui/components/theme-provider"
import { TextSizeProvider } from "@ui/components/text-size-provider"
import { Toaster } from "sonner"
import NextTopLoader from "nextjs-toploader"
import { QueryProvider } from "@/providers/query-provider"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { StoreAuthGate } from "@/components/shared/store-auth-gate"
import {
  absoluteUrl,
  buildSeoMetadata,
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo"

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
  ...buildSeoMetadata(),
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "HUB Parent",
    "kết nối phụ huynh nhà trường",
    "Trường Đại học Ngân hàng TP.HCM",
    "thông tin học tập sinh viên",
    "cổng phụ huynh HUB",
  ],
  authors: [{ name: "Trường Đại học Ngân hàng TP.HCM" }],
  creator: "Trường Đại học Ngân hàng TP.HCM",
  publisher: "Trường Đại học Ngân hàng TP.HCM",
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollegeOrUniversity",
      "@id": absoluteUrl("/#organization"),
      name: "Trường Đại học Ngân hàng TP.HCM",
      alternateName: "HUB",
      url: "https://hub.edu.vn",
      logo: absoluteUrl("/favicon.ico"),
      image: OG_IMAGE_URL,
      sameAs: ["https://hub.edu.vn"],
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: SITE_NAME,
      url: absoluteUrl("/"),
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN",
      publisher: {
        "@id": absoluteUrl("/#organization"),
      },
    },
  ],
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
    >
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
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
              <Header />
              <StoreAuthGate>
                <main id="main-content" className="flex-1">
                  {children}
                </main>
              </StoreAuthGate>
              <Suspense fallback={null}>
                <ScrollToTop />
              </Suspense>
              <Footer />
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </TextSizeProvider>
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  )
}
