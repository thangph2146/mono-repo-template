"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@ui/components/button";
import { Sidebar } from "@/components/sidebar";
import { TextSizeToggle } from "@ui/components/text-size-toggle";
import { useAuth, useClientReady } from "@/providers/auth-provider";

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

  useEffect(() => {
    if (!clientReady || isLogin) return;
    if (!user) router.replace("/login");
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
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm bg-surface/80">
          <h2 className="text-xl font-bold md:hidden text-primary">B2B Admin</h2>
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
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
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
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
