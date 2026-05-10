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
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  UserCircle,
} from "lucide-react";
import { cn } from "@ui/lib/utils";
import {
  canUserAccess,
  PERMISSION_CODES,
  type PermissionCode,
} from "@workspace/api-client";
import { useAuth } from "@/providers/auth-provider";

type MenuItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** `null` = mọi user đã đăng nhập */
  permission: PermissionCode | null;
};

const menuItems: MenuItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, permission: null },
  {
    href: "/profile",
    label: "Hồ sơ & tài khoản",
    icon: UserCircle,
    permission: null,
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

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visible = menuItems.filter(
    (item) =>
      item.permission === null ||
      (user && canUserAccess(user, item.permission)),
  );

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border hidden md:flex flex-col text-sidebar-foreground sticky top-0 h-screen transition-[width] duration-300 ease-out overflow-hidden",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-b border-sidebar-border/50 shrink-0",
          collapsed ? "p-3 flex justify-center" : "p-6",
        )}
      >
        <Link
          href="/"
          className={cn(
            "flex items-center rounded-xl transition-colors group",
            collapsed ? "justify-center" : "gap-3",
          )}
          title="Tổng quan"
        >
          <div className="bg-primary/10 p-2 rounded-xl transition-colors group-hover:bg-primary/20 shrink-0">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-heading text-xl font-bold text-primary truncate">
              B2B Admin
            </span>
          )}
        </Link>
      </div>
      <nav
        className={cn(
          "flex-1 overflow-y-auto space-y-2",
          collapsed ? "p-2" : "p-4",
        )}
      >
        {visible.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group",
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
                <span className="font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "border-t border-sidebar-border/50 shrink-0 space-y-1",
          collapsed ? "p-2" : "p-4",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={cn(
            "flex w-full items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-sm",
            collapsed ? "justify-center p-3" : "gap-3 px-4 py-3 text-left",
          )}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="size-5 shrink-0" />
              <span className="font-medium">Thu gọn</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => logout()}
          title="Đăng xuất"
          className={cn(
            "flex w-full items-center rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group text-left",
            collapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
          )}
        >
          <LogOut className="size-5 shrink-0 text-sidebar-foreground/50 group-hover:text-destructive" />
          {!collapsed && <span className="font-medium">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
