import Link from "next/link";
import { Store, ShieldCheck, HelpCircle, LifeBuoy } from "lucide-react";
import { Text } from "@ui/components/typography";

export function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant bg-surface-container-low py-4 px-6 opacity-90 mt-auto">
      <div className="mx-auto max-w-full">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Store className="size-5" />
              <Text as="span" variant="label" className="font-bold">StoreSync B2B Management</Text>
            </Link>
            <span className="hidden md:inline text-outline-variant">|</span>
            <Text variant="small">
              © {new Date().getFullYear()} All rights reserved.
            </Text>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/terms" className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <ShieldCheck className="size-4" />
              <Text variant="small">Terms of Service</Text>
            </Link>
            <Link href="/privacy" className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <ShieldCheck className="size-4" />
              <Text variant="small">Privacy Policy</Text>
            </Link>
            <Link href="/support" className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <LifeBuoy className="size-4" />
              <Text variant="small">Vendor Support</Text>
            </Link>
            <Link href="/help" className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <HelpCircle className="size-4" />
              <Text variant="small">Help Center</Text>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
