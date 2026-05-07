import Link from "next/link";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ListTodo, 
  Package, 
  Store, 
  LogOut, 
  Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col text-sidebar-foreground">
        <div className="p-6 border-b border-sidebar-border/50">
          <Link href="/admin/orders" className="flex items-center gap-3 group">
            <div className="bg-primary/10 p-2 rounded-xl transition-colors group-hover:bg-primary/20">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <span className="font-heading text-xl font-bold text-primary">
              B2B Admin
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-sidebar-primary/10 text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
             <LayoutDashboard className="size-5" />
             <span className="font-medium">Tổng quan</span>
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
             <ListTodo className="size-5" />
             <span className="font-medium">Quản lý Đơn hàng</span>
          </Link>
          <Link href="/admin/inventory" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
             <Package className="size-5" />
             <span className="font-medium">Kho hàng & Sản phẩm</span>
          </Link>
          <Link href="/admin/locations" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
             <Store className="size-5" />
             <span className="font-medium">Đại lý & Cửa hàng</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border/50">
           <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
             <LogOut className="size-5" />
             <span className="font-medium">Đăng xuất</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-sm bg-surface/80">
          <h2 className="text-xl font-bold md:hidden text-primary">B2B Admin</h2>
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <Bell className="size-5" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">Quản trị viên</p>
                <p className="text-xs text-muted-foreground mt-1">Admin Level 1</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
                AD
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
