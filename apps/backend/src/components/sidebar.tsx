"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Database,
  LayoutDashboard,
  ListTodo,
  Package,
  Store,
  Tags,
  TicketPercent,
  LogOut,
  Users,
} from "lucide-react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib/utils";
import { useOrderAlerts } from "@/providers/admin-order-alerts-provider";
import {
  canUserAccess,
  PERMISSION_CODES,
  type PermissionCode,
} from "@workspace/api-client";
import { useAuth } from "@/providers/auth-provider";
import type { AuthUser } from "@/lib/api";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** `null` = không kiểm tra một mã đơn lẻ (dùng kèm {@link anyPermission} hoặc mở cho mọi user). */
  permission: PermissionCode | null;
  /** Nếu có: user cần ít nhất một quyền trong danh sách (ưu tiên hơn `permission`). */
  anyPermission?: PermissionCode[];
};

const menuItems: MenuItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, permission: null },
  {
    href: "/staff",
    label: "Nhân sự & phân quyền",
    icon: Users,
    permission: null,
    anyPermission: [
      PERMISSION_CODES.USERS_MANAGE,
      PERMISSION_CODES.RBAC_READ,
    ],
  },
  {
    href: "/orders",
    label: "Quản lý Đơn hàng",
    icon: ListTodo,
    permission: PERMISSION_CODES.ORDERS_READ,
  },
  {
    href: "/inventory",
    label: "Kho hàng & Sản phẩm",
    icon: Package,
    permission: PERMISSION_CODES.PRODUCTS_READ,
  },
  {
    href: "/categories",
    label: "Loại sản phẩm",
    icon: Tags,
    permission: PERMISSION_CODES.CATEGORIES_READ,
  },
  {
    href: "/promo-codes",
    label: "Mã khuyến mãi",
    icon: TicketPercent,
    permission: PERMISSION_CODES.PRODUCTS_READ,
  },
  {
    href: "/locations",
    label: "Đại lý & Cửa hàng",
    icon: Store,
    permission: PERMISSION_CODES.PRODUCTS_READ,
  },
  {
    href: "/data",
    label: "Sao lưu dữ liệu",
    icon: Database,
    permission: PERMISSION_CODES.DATA_MAINTENANCE,
  },
];

export function getVisibleMenuItems(user: AuthUser | null): MenuItem[] {
  if (!user) return [];
  return menuItems.filter((item) => {
    if (item.anyPermission?.length) {
      return item.anyPermission.some((p) => canUserAccess(user, p));
    }
    if (item.permission === null) return true;
    return canUserAccess(user, item.permission);
  });
}

export function SidebarNavLinks({
  collapsed,
  onLinkClick,
  className,
}: {
  collapsed: boolean;
  onLinkClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { pendingCount } = useOrderAlerts();
  const visible = getVisibleMenuItems(user);

  return (
    <nav
      className={cn(
        "flex-1 overflow-y-auto space-y-2",
        collapsed ? "p-2" : "p-4",
        className,
      )}
    >
      {visible.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        const orderBadge =
          item.href === "/orders" && pendingCount > 0 ? pendingCount : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            onClick={onLinkClick}
            className={cn(
              "relative flex items-center rounded-lg transition-all duration-200 group",
              collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
              isActive
                ? "bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
              )}
            />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {item.label}
                </span>
                {orderBadge > 0 ? (
                  <Badge
                    className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[0.65rem] tabular-nums"
                  >
                    {orderBadge > 99 ? "99+" : orderBadge}
                  </Badge>
                ) : null}
              </>
            )}
            {collapsed && orderBadge > 0 ? (
              <span className="pointer-events-none absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground ring-2 ring-sidebar">
                {orderBadge > 9 ? "9+" : orderBadge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Menu dạng drawer cho màn hình nhỏ (Sheet). */
export function MobileSidebarPanel({ onNavigate }: { onNavigate: () => void }) {
  const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-sidebar-border/50 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl transition-colors"
          onClick={onNavigate}
        >
          <div className="shrink-0 rounded-xl bg-primary/10 p-2">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <span className="font-heading text-lg font-bold text-primary truncate">
            B2B Admin
          </span>
        </Link>
      </div>
      <SidebarNavLinks collapsed={false} onLinkClick={onNavigate} />
      <div className="mt-auto shrink-0 border-t border-sidebar-border/50 p-4">
        <Button
          type="button"
          variant="outline"
          className="h-auto min-h-11 w-full justify-start gap-3 rounded-xl border-destructive/25 bg-sidebar px-4 py-3 text-left font-medium text-destructive shadow-none hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            onNavigate();
            void logout();
          }}
          aria-label="Đăng xuất"
        >
          <LogOut aria-hidden className="size-5 shrink-0" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}

type SidebarProps = {
  collapsed: boolean;
};

export function Sidebar({ collapsed }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-sidebar-border/50",
          collapsed ? "flex justify-center p-3" : "p-6",
        )}
      >
        <Link
          href="/"
          className={cn(
            "group flex items-center rounded-xl transition-colors",
            collapsed ? "justify-center" : "gap-3",
          )}
          title="Tổng quan"
        >
          <div className="shrink-0 rounded-xl bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-heading truncate text-xl font-bold text-primary">
              B2B Admin
            </span>
          )}
        </Link>
      </div>
      <SidebarNavLinks collapsed={collapsed} />
      <div
        className={cn(
          "shrink-0 space-y-1 border-t border-sidebar-border/50",
          collapsed ? "p-2" : "p-4",
        )}
      >
        <Button
          type="button"
          title="Đăng xuất"
          aria-label="Đăng xuất"
          onClick={() => logout()}
          className={cn(
            collapsed
              ? "size-11 justify-center rounded-xl p-0"
              : "h-auto min-h-11 w-full justify-center gap-3 rounded-xl px-4 py-3",
          )}
        >
          <LogOut
            aria-hidden
            className={cn(
              "size-5 shrink-0",
              collapsed && "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
            )}
          />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </Button>
      </div>
    </aside>
  );
}
