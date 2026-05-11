"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@ui/components/sheet";
import { MobileSidebarPanel, Sidebar } from "@/components/sidebar";
import { TextSizeToggle } from "@ui/components/text-size-toggle";
import { canAccessStaffAdmin } from "@workspace/api-client";
import { useAuth, useClientReady } from "@/providers/auth-provider";
import {
  ADMIN_SESSION_EVENT,
  clearAdminSession,
} from "@/lib/auth-session";
import { isAuthPath } from "@/lib/auth-routes";

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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground md:flex-row">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="flex w-[min(100vw,20rem)] flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-sm"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menu điều hướng</SheetTitle>
          </SheetHeader>
          <MobileSidebarPanel onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-3 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-lg text-muted-foreground hover:text-primary md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-6" />
            </Button>
            <h2 className="shrink-0 truncate text-lg font-bold text-primary sm:text-xl md:hidden">
              B2B Admin
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden shrink-0 rounded-lg text-muted-foreground hover:text-primary md:inline-flex"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? "Mở sidebar" : "Thu gọn sidebar"}
              title={sidebarCollapsed ? "Mở sidebar" : "Thu gọn sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="size-5" />
              ) : (
                <PanelLeftClose className="size-5" />
              )}
            </Button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 sm:gap-4">
            <TextSizeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary"
              type="button"
            >
              <Bell className="size-5" />
            </Button>
            <Link
              href="/profile"
              className="flex items-center gap-3 pl-4 border-l border-border/50 rounded-lg pr-1 py-1 -my-1 hover:bg-muted/60 transition-colors"
              title="Hồ sơ & tài khoản"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.fullName}</p>
                <p
                  className="text-xs text-muted-foreground mt-1 max-w-[220px] truncate"
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
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
