import Link from "next/link";
import { Store, ShieldCheck, HelpCircle, LifeBuoy } from "lucide-react";
import { Text } from "@ui/components/typography";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-surface-container-low/95 px-6 py-6 text-foreground">
      <div className="mx-auto max-w-full">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-4">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Store className="size-5" />
              <Text as="span" variant="label" className="font-bold">Hub B2B</Text>
            </Link>
            <span className="hidden md:inline text-outline-variant">|</span>
            <Text variant="small">
              © {new Date().getFullYear()} All rights reserved.
            </Text>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/terms" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <ShieldCheck className="size-4" />
              <Text variant="small">Terms of Service</Text>
            </Link>
            <Link href="/privacy" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <ShieldCheck className="size-4" />
              <Text variant="small">Privacy Policy</Text>
            </Link>
            <Link href="/support" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <LifeBuoy className="size-4" />
              <Text variant="small">Vendor Support</Text>
            </Link>
            <Link href="/help" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <HelpCircle className="size-4" />
              <Text variant="small">Help Center</Text>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
