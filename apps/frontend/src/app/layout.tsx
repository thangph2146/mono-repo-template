import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "@ui/globals.css";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { ThemeProvider } from "@ui/components/theme-provider";
import { TextSizeProvider } from "@ui/components/text-size-provider";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/providers/query-provider";
import { CartSyncBridge } from "@/components/shared/cart-sync-bridge";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s · StoreSync B2B",
    default: "Trang chủ",
  },
  description:
    "Giải pháp nhập hàng sỉ và quản lý kho bãi hiện đại cho cửa hàng tiện lợi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <NextTopLoader 
          color="var(--primary)" 
          showSpinner={false} 
          shadow="0 0 10px var(--primary),0 0 5px var(--primary)" 
        />
        <ThemeProvider>
          <TextSizeProvider>
            <QueryProvider>
              <CartSyncBridge />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </TextSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
