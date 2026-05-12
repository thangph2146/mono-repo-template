"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { MobileSidebarPanel, Sidebar } from "@/components/sidebar";
import { TextSizeToggle } from "@ui/components/text-size-toggle";
import { Page, PageContent } from "@ui/components/layout";
import { canAccessStaffAdmin, canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { useAuth, useClientReady } from "@/providers/auth-provider";
import { AdminOrderAlertsProvider } from "@/providers/admin-order-alerts-provider";
import { AdminNotificationBell } from "@/components/admin-notification-bell";
import {
  ADMIN_SESSION_EVENT,
  clearAdminSession,
} from "@/lib/auth-session";
import { isAuthPath } from "@/lib/auth-routes";
import {
  ADMIN_HEADER_ROLE_LINE_CLASS,
  ADMIN_MAIN_SCROLL_CLASS,
  ADMIN_PAGE_CONTENT_CLASS,
  ADMIN_SHEET_NAV_CLASS,
} from "@ui/lib/layout-shell";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

function initials(fullName: string): string {
  const p = fullName.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function roleSummary(user: { roles: { code: string; name: string }[] }): string {
  if (!user.roles.length) return "Chưa gán vai trò";
  return user.roles.map((r) => r.name).join(" · ");
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
  const onAuthRoute = isAuthPath(pathname);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const skipSidebarPersist = useRef(true);

  useEffect(() => {
    try {
      setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipSidebarPersist.current) {
      skipSidebarPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

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
        router.replace("/login?reason=staff_only");
      }
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessStaffAdmin(user)) {
      clearAdminSession();
      window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
      router.replace("/login?reason=staff_only");
    }
  }, [clientReady, onAuthRoute, user, router]);

  if (onAuthRoute) {
    if (!clientReady) {
      return <AuthLoadingScreen message="Đang tải…" />;
    }
    if (user && canAccessStaffAdmin(user)) {
      return <AuthLoadingScreen message="Đang chuyển về bảng điều khiển…" />;
    }
    return <>{children}</>;
  }

  if (!clientReady || !user) {
    return <AuthLoadingScreen message="Đang tải…" />;
  }

  const orderAlertsEnabled =
    !!user && canUserAccess(user, PERMISSION_CODES.ORDERS_READ);

  return (
    <AdminOrderAlertsProvider alertsEnabled={orderAlertsEnabled}>
      <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground md:flex-row">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-3 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 min-h-11 min-w-11 shrink-0 rounded-xl border-border/70 bg-background/90 text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow active:scale-[0.98] md:hidden [&_svg]:size-5"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-nav"
            >
              <Menu aria-hidden className="size-5" />
            </Button>
            <h2 className="shrink-0 truncate text-lg font-bold text-primary sm:text-xl md:hidden">
              B2B Admin
            </h2>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden h-10 w-10 shrink-0 rounded-xl border-border/70 bg-background/90 text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow active:scale-[0.98] md:inline-flex [&_svg]:size-5"
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
          <div className="flex items-center gap-2 sm:gap-4">
            <TextSizeToggle />
            <AdminNotificationBell />
            <Link
              href="/profile"
              className="flex items-center gap-3 pl-4 border-l border-border/50 rounded-lg pr-1 py-1 -my-1 hover:bg-muted/60 transition-colors"
              title="Hồ sơ & tài khoản"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.fullName}</p>
                <p
                  className={ADMIN_HEADER_ROLE_LINE_CLASS}
                  title={roleSummary(user)}
                >
                  {roleSummary(user)}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20 text-sm">
                {initials(user.fullName)}
              </div>
            </Link>
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
    </AdminOrderAlertsProvider>
  );
}
