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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visible = menuItems.filter(
    (item) =>
      item.permission === null ||
      (user && canUserAccess(user, item.permission)),
  );

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col text-sidebar-foreground sticky top-0 h-screen transition-all duration-300">
      <div className="p-6 border-b border-sidebar-border/50">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary/10 p-2 rounded-xl transition-colors group-hover:bg-primary/20">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <span className="font-heading text-xl font-bold text-primary">
            B2B Admin
          </span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visible.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200 group-hover:scale-110",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground",
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border/50">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group text-left"
        >
          <LogOut className="size-5 text-sidebar-foreground/50 group-hover:text-destructive" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
