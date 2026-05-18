"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Sun,
  UserCircle2,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { MobileSidebarPanel, Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@ui/components/theme-toggle";
import { Page, PageContent } from "@ui/components/layout";
import { TypographyH2 } from "@ui/components/typography";
import { useTextSize } from "@ui/components/text-size-provider";
import { useTheme } from "@ui/components/theme-provider";
import { canAccessStaffAdmin } from "@workspace/api-client";
import { useAuth, useClientReady } from "@/providers/auth-provider";
import { AdminNotificationBell } from "@/components/admin-notification-bell";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  ADMIN_SESSION_EVENT,
  clearAdminSession,
} from "@/lib/auth-session";
import {
  AUTH_LOGIN_PATH,
  isAuthPath,
} from "@/lib/auth-routes";
import {
  ADMIN_HEADER_ROLE_LINE_CLASS,
  ADMIN_MAIN_SCROLL_CLASS,
  ADMIN_PAGE_CONTENT_CLASS,
  ADMIN_SHEET_NAV_CLASS,
} from "@ui/lib/layout-shell";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

const HEADER_ICON_BTN_MOBILE = cn(
  "h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-lg border-border/70 bg-background/90 text-muted-foreground shadow-sm",
  "hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow active:scale-[0.98] md:hidden [&_svg]:size-5",
);

const HEADER_ICON_BTN_DESKTOP = cn(
  "hidden h-10 w-10 shrink-0 rounded-lg border-border/70 bg-background/90 text-muted-foreground shadow-sm",
  "hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow active:scale-[0.98] md:inline-flex [&_svg]:size-5",
);

const HEADER_PROFILE_TRIGGER = cn(
  "group relative inline-flex min-h-12 min-w-12 items-center gap-3 rounded-lg border border-border/70 bg-background/95 px-2.5 py-1.5 pr-3 text-left shadow-sm ring-1 ring-black/5 backdrop-blur-xl",
  "transition-all duration-200 hover:-translate-y-px hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-md",
  "aria-expanded:border-primary/25 aria-expanded:bg-primary/[0.05] aria-expanded:shadow-md",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 supports-[backdrop-filter]:bg-background/75",
);

const HEADER_PROFILE_AVATAR = cn(
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-gradient-to-br from-primary/15 to-primary/5",
  "text-sm font-extrabold tracking-wide text-primary shadow-inner transition-all duration-200",
  "group-hover:border-primary/25 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-sm",
  "group-aria-expanded:border-primary/25 group-aria-expanded:from-primary/20 group-aria-expanded:to-primary/10",
);

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function roleSummary(user: { roles: { name: string; displayName: string }[] }): string {
  if (!user.roles.length) return "Chưa gán vai trò";
  return user.roles.map((r) => r.displayName || r.name).join(" · ");
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clientReady = useClientReady();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { size, setSize } = useTextSize();
  const displayName = user?.name?.trim() || user?.email || "Người dùng HUB";
  const onAuthRoute = isAuthPath(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  // Force editor toolbar sticky via JS to overcome any CSS specificity issues
  useEffect(() => {
    const forceToolbarSticky = () => {
      document.querySelectorAll<HTMLElement>(".editor-toolbar").forEach((el) => {
        el.style.setProperty("position", "sticky", "important");
        el.style.setProperty("top", "-25px", "important");
      });
    };
    forceToolbarSticky();
    const timer = setTimeout(forceToolbarSticky, 500);
    const observer = new MutationObserver(forceToolbarSticky);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!clientReady) return;

    if (onAuthRoute) {
      if (user && canAccessStaffAdmin(user)) {
        router.replace("/");
        return;
      }
      if (user && !canAccessStaffAdmin(user)) {
        clearAdminSession();
        window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
        router.replace(`${AUTH_LOGIN_PATH}?reason=staff_only`);
      }
      return;
    }

    if (!user) {
      router.replace(AUTH_LOGIN_PATH);
      return;
    }
    if (!canAccessStaffAdmin(user)) {
      clearAdminSession();
      window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
      router.replace(`${AUTH_LOGIN_PATH}?reason=staff_only`);
    }
  }, [clientReady, onAuthRoute, user, router]);

  if (onAuthRoute) {
    if (!clientReady) {
      return <AuthLoadingScreen message="Đang tải…" />;
    }
    if (user && canAccessStaffAdmin(user)) {
      return <AuthLoadingScreen message="Đang chuyển về bảng điều khiển…" />;
    }
    return (
      <>
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-border bg-background/90 p-0.5 shadow-sm backdrop-blur-sm">
          <ThemeToggle />
        </div>
        {children}
      </>
    );
  }

  if (!clientReady || !user) {
    return <AuthLoadingScreen message="Đang tải…" />;
  }

  const rolesDisplay = roleSummary(user);

  return (
    <>
    <div className="flex h-screen w-full flex-col bg-background font-sans text-foreground md:flex-row">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent
            id="admin-mobile-nav"
            side="left"
            showCloseButton
            className={ADMIN_SHEET_NAV_CLASS}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu điều hướng</SheetTitle>
            </SheetHeader>
            <MobileSidebarPanel onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <Sidebar collapsed={sidebarCollapsed} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header data-admin-header="true" className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 px-3 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 sm:min-h-[4.5rem] sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={HEADER_ICON_BTN_MOBILE}
                onClick={() => setMobileNavOpen(true)}
                aria-label="Mở menu điều hướng"
                aria-expanded={mobileNavOpen}
                aria-controls="admin-mobile-nav"
              >
                <Menu aria-hidden className="size-5" />
              </Button>
              <TypographyH2 className="shrink-0 truncate text-lg font-bold text-primary sm:text-xl md:hidden">
                B2B Admin
              </TypographyH2>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={HEADER_ICON_BTN_DESKTOP}
                onClick={() => setSidebarCollapsed((c) => !c)}
                aria-label={sidebarCollapsed ? "Mở sidebar" : "Thu gọn sidebar"}
                title={sidebarCollapsed ? "Mở sidebar" : "Thu gọn sidebar"}
                aria-pressed={!sidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <PanelLeft aria-hidden className="size-5" />
                ) : (
                  <PanelLeftClose aria-hidden className="size-5" />
                )}
              </Button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2 sm:gap-3">
              <AdminNotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className={HEADER_PROFILE_TRIGGER}
                      aria-label="Mở menu tài khoản và tuỳ chỉnh giao diện"
                    />
                  }
                >
                  <div className="hidden min-w-0 text-right sm:block">
                    <p className="max-w-[220px] truncate text-sm font-bold leading-none text-foreground">
                      {displayName}
                    </p>
                    <p
                      className={cn(
                        ADMIN_HEADER_ROLE_LINE_CLASS,
                        "mt-1 max-w-[220px] truncate text-[11px] text-muted-foreground/90",
                      )}
                      title={rolesDisplay}
                    >
                      {rolesDisplay}
                    </p>
                  </div>
                  <div className={HEADER_PROFILE_AVATAR}>
                    {initials(displayName)}
                  </div>
                  <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180 sm:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  <div className="px-2 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                        {initials(displayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" title={rolesDisplay}>
                          {rolesDisplay}
                        </p>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-md px-2 py-2"
                      onClick={() => router.push("/profile")}
                    >
                      <UserCircle2 className="size-4 text-muted-foreground" />
                      Hồ sơ và tài khoản
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Giao diện
                  </div>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) =>
                      setTheme(value as "light" | "dark" | "system")
                    }
                  >
                    <DropdownMenuRadioItem
                      value="light"
                      className="cursor-pointer rounded-md px-2 py-2"
                    >
                      <Sun className="size-4 text-muted-foreground" />
                      Sáng
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="dark"
                      className="cursor-pointer rounded-md px-2 py-2"
                    >
                      <Moon className="size-4 text-muted-foreground" />
                      Tối
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="system"
                      className="cursor-pointer rounded-md px-2 py-2"
                    >
                      <Monitor className="size-4 text-muted-foreground" />
                      Theo hệ thống
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Cỡ chữ
                  </div>
                  <DropdownMenuRadioGroup
                    value={size}
                    onValueChange={(value) => setSize(value as "sm" | "base" | "lg")}
                  >
                    <div className="grid grid-cols-3 gap-2 px-2 pb-1 pt-1">
                      <DropdownMenuRadioItem
                        value="sm"
                        className="cursor-pointer justify-center rounded-md border border-border px-2 py-2 font-bold"
                      >
                        S
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="base"
                        className="cursor-pointer justify-center rounded-md border border-border px-2 py-2 font-bold"
                      >
                        M
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="lg"
                        className="cursor-pointer justify-center rounded-md border border-border px-2 py-2 font-bold"
                      >
                        L
                      </DropdownMenuRadioItem>
                    </div>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className={ADMIN_MAIN_SCROLL_CLASS}>
            <Page as="div">
              <PageContent className={ADMIN_PAGE_CONTENT_CLASS}>
                {children}
              </PageContent>
            </Page>
          </main>
        </div>
      </div>
      <ScrollToTop />
    </>
  );
}
