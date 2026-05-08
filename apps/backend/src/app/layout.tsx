import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "@ui/globals.css";
import {
  Bell
} from "lucide-react";
import { Button } from "@ui/components/button";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import NextTopLoader from "nextjs-toploader";
import { TextSizeProvider } from "@ui/components/text-size-provider";
import { TextSizeToggle } from "@ui/components/text-size-toggle";

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
  title: "StoreSync Admin Dashboard",
  description: "Manage your B2B store with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground" suppressHydrationWarning>
        <NextTopLoader
          color="var(--primary)"
          showSpinner={false}
          shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
        />
        <TextSizeProvider>
        <div className="min-h-screen bg-background text-foreground flex font-sans w-full">
          <Sidebar />

          {/* Main Admin Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm bg-surface/80">
              <h2 className="text-xl font-bold md:hidden text-primary">B2B Admin</h2>
              <div className="flex-1"></div>
              <div className="flex items-center gap-4">
                <TextSizeToggle />
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Bell className="size-5" />
                </Button>
                <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold leading-none">Quản trị viên</p>
                    <p className="text-xs text-muted-foreground mt-1">Admin Level 1</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
                    AD
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
              {children}
            </main>
          </div>
        </div>
        </TextSizeProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
