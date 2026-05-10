"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Store,
  ShoppingCart,
  Package,
  Headphones,
  Box,
  ShieldCheck,
  Bell,
  UserCircle,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { Badge } from "@ui/components/badge";
import { useCart, cartStore } from "@/hooks/use-cart";
import { ThemeToggle } from "@ui/components/theme-toggle";
import { TextSizeToggle } from "@ui/components/text-size-toggle";
import { Separator } from "@ui/components/separator";
import { Button } from "@ui/components/button";
import { Heading, Text } from "@ui/components/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { useSession } from "@/hooks/use-session";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const { unitCount } = useCart();

  const nav = useMemo(() => {
    const items: { href: string; label: string; icon: typeof ShoppingCart }[] = [
      { href: "/catalog", label: "Danh mục sỉ", icon: ShoppingCart },
    ];
    if (session) {
      items.push({ href: "/orders", label: "Đơn hàng", icon: Package });
    }
    items.push(
      { href: "/support", label: "Hỗ trợ", icon: Headphones },
      { href: "/graph", label: "Sơ đồ hệ thống", icon: Box },
    );
    return items;
  }, [session]);

  const profileHref = "/profile";

  const handleLogout = () => {
    localStorage.removeItem("storesync_session");
    cartStore.clear();
    window.dispatchEvent(new Event("storesync-session"));
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant bg-surface/80 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-full items-center px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-1.5 rounded-lg transition-colors group-hover:bg-primary/20">
            <Store className="size-6 text-primary" />
          </div>
          <Heading as="span" size="title" className="text-primary tracking-tight">StoreSync B2B</Heading>
        </Link>

        {/* Nav */}
        <nav className="ml-auto hidden md:flex items-center gap-4">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "relative flex items-center gap-1.5 px-1 py-1 transition-all duration-200 " +
                  (isActive
                    ? "text-primary font-semibold"
                    : "text-on-surface-variant hover:text-primary")
                }
              >
                <Text as="span" variant="label" className="font-bold">{item.label}</Text>
                {isActive && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}

          <Separator orientation="vertical" className="mx-2 h-6 bg-outline-variant/50" />

          <div className="flex items-center gap-1">
            <Link
              href="/cart"
              aria-label="Giỏ hàng"
              className="relative inline-flex items-center justify-center rounded-lg size-9 text-on-surface-variant hover:text-primary hover:bg-muted transition-colors"
            >
              <ShoppingCart className="size-5" />
              {unitCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border border-background">
                  {unitCount}
                </Badge>
              )}
            </Link>
            <Button variant="ghost" size="icon" className="text-on-surface-variant hover:text-primary">
              <Bell className="size-5" />
            </Button>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  {session.role === "admin" ? (
                    <ShieldCheck className="size-5 text-primary" />
                  ) : (
                    <UserCircle className="size-5 text-primary" />
                  )}
                  <span className="text-xs font-semibold text-foreground max-w-28 truncate">
                    {session.displayName}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(profileHref)}>
                      <User className="size-4" />
                      Trang cá nhân
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <Package className="size-4" />
                      Bảng điều khiển
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon" className="text-on-surface-variant hover:text-primary">
                  <UserCircle className="size-5" />
                </Button>
              </Link>
            )}
          </div>

          <Separator orientation="vertical" className="mx-2 h-6 bg-outline-variant/50" />

          <div className="flex items-center gap-2">
            <TextSizeToggle />
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
