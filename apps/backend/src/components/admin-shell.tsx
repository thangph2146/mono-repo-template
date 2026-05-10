"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@ui/components/button";
import { Sidebar } from "@/components/sidebar";
import { TextSizeToggle } from "@ui/components/text-size-toggle";
import { canAccessStaffAdmin } from "@workspace/api-client";
import { useAuth, useClientReady } from "@/providers/auth-provider";
import {
  ADMIN_SESSION_EVENT,
  clearAdminSession,
} from "@/lib/auth-session";

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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clientReady = useClientReady();
  const { user } = useAuth();
  const isLogin = pathname === "/login";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    if (!clientReady || isLogin) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessStaffAdmin(user)) {
      clearAdminSession();
      window.dispatchEvent(new Event(ADMIN_SESSION_EVENT));
      router.replace("/login?reason=staff_only");
    }
  }, [clientReady, isLogin, user, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!clientReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans w-full">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm bg-surface/80">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold md:hidden text-primary shrink-0">
              B2B Admin
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex text-muted-foreground hover:text-primary shrink-0 rounded-lg"
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
          <div className="flex items-center gap-4">
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
        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
