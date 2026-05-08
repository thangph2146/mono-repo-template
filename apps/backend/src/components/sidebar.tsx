"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ListTodo, 
  Package, 
  Store, 
  LogOut 
} from "lucide-react";
import { cn } from "@ui/lib/utils";

const menuItems = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/orders", label: "Quản lý Đơn hàng", icon: ListTodo },
  { href: "/inventory", label: "Kho hàng & Sản phẩm", icon: Package },
  { href: "/locations", label: "Đại lý & Cửa hàng", icon: Store },
];

export function Sidebar() {
  const pathname = usePathname();

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
        {menuItems.map((item) => {
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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn(
                "size-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border/50">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
        >
          <LogOut className="size-5 text-sidebar-foreground/50 group-hover:text-destructive" />
          <span className="font-medium">Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}
