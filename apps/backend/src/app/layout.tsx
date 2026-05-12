import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "@ui/globals.css";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "@ui/components/theme-provider";
import { TextSizeProvider } from "@ui/components/text-size-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AdminShell } from "@/components/admin-shell";

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
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground" suppressHydrationWarning>
        <NextTopLoader
          color="var(--primary)"
          showSpinner={false}
          shadow="0 0 10px var(--primary),0 0 5px var(--primary)"
        />
        <ThemeProvider>
          <TextSizeProvider>
            <QueryProvider>
              <AuthProvider>
                <AdminShell>{children}</AdminShell>
              </AuthProvider>
              <Toaster position="top-right" richColors />
            </QueryProvider>
          </TextSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
