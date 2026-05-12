"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { PageSection } from "@ui/components/layout";
import {
  Package2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Users,
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  Info,
  ArrowRight,
  ShieldOff,
} from "lucide-react";
import { cn } from "@ui/lib/utils";
import { ADMIN_DASHBOARD_EMPTY_INNER_CLASS } from "@ui/lib/layout-shell";
import { useOrders, useProducts } from "@/hooks/queries";
import { formatVND } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const canProducts = user
    ? canUserAccess(user, PERMISSION_CODES.PRODUCTS_READ)
    : false;
  const canOrders = user
    ? canUserAccess(user, PERMISSION_CODES.ORDERS_READ)
    : false;

  const productsResource = useProducts({ enabled: canProducts });
  const ordersResource = useOrders({ enabled: canOrders });

  const products = useMemo(
    () => productsResource.data?.items ?? [],
    [productsResource.data],
  );
  const orders = useMemo(
    () => ordersResource.data?.items ?? [],
    [ordersResource.data],
  );

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const shipping = orders.filter(
      (o) => o.status === "shipped" || o.status === "confirmed",
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const lowStock = products.filter((p) => p.stock < 50 && p.stock > 0).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    return { pending, shipping, delivered, revenue, lowStock, outOfStock };
  }, [orders, products]);

  const loading =
    (canProducts && productsResource.isLoading) ||
    (canOrders && ordersResource.isLoading);
  const error = productsResource.error ?? ordersResource.error;
  const noOverviewAccess = !canProducts && !canOrders;
  const dashboardRefreshing =
    (canProducts && productsResource.isFetching) ||
    (canOrders && ordersResource.isFetching);

  const refreshDashboard = (): void => {
    if (canProducts) void productsResource.refetch();
    if (canOrders) void ordersResource.refetch();
  };

  return (
    <PageSection max="full" className="min-w-0 space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-foreground">
            <LayoutDashboard className="size-9 shrink-0 text-primary" aria-hidden />
            Tổng quan vận hành
          </h1>
          <p className="mt-1 text-lg font-medium text-on-surface-variant">
            Theo dõi nhanh tồn kho và đơn hàng theo thời gian thực
          </p>
        </div>
        {!noOverviewAccess ? (
          <Button
            type="button"
            variant="outline"
            className="flex h-12 items-center gap-2 rounded-xl border-outline-variant px-5 font-semibold hover:bg-muted"
            onClick={refreshDashboard}
          >
            <RefreshCw
              className={cn("size-5", dashboardRefreshing && "animate-spin")}
              aria-hidden
            />
            Làm mới
          </Button>
        ) : null}
      </div>

      {!noOverviewAccess ? (
        <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4 shadow-sm">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-on-surface-variant">
              Số liệu trên trang này lấy từ danh sách sản phẩm và đơn hàng (theo quyền của
              bạn). Dùng nút <span className="font-semibold text-foreground">Làm mới</span>{" "}
              để đồng bộ nhanh với API.
            </span>
          </p>
        </div>
      ) : null}

      {noOverviewAccess && (
        <div className="rounded-2xl border border-border bg-muted/20 px-6 py-8 text-muted-foreground">
          <div className={ADMIN_DASHBOARD_EMPTY_INNER_CLASS}>
            <ShieldOff className="size-10 text-muted-foreground/80" aria-hidden />
            <p className="font-semibold text-foreground">Không đủ quyền xem tổng quan</p>
            <p className="text-sm">
              Tài khoản cần quyền <span className="font-mono">products.read</span> hoặc{" "}
              <span className="font-mono">orders.read</span>. Dùng menu bên trái theo quyền
              được gán.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Không tải được dữ liệu</p>
              <p className="mt-1 text-sm opacity-90">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {!noOverviewAccess && !loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Clock className="w-5 h-5 text-warning" />}
              label="Đơn chờ xử lý"
              value={stats.pending}
              tone="warning"
            />
            <StatCard
              icon={<Truck className="w-5 h-5 text-primary" />}
              label="Đơn đang giao"
              value={stats.shipping}
              tone="primary"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-success" />}
              label="Đơn đã giao"
              value={stats.delivered}
              tone="success"
            />
            <StatCard
              icon={<ShoppingBag className="w-5 h-5 text-foreground" />}
              label="Doanh thu đã thu"
              value={formatVND(stats.revenue)}
              tone="default"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-outline-variant">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package2 className="w-5 h-5 text-primary" />
                  Hàng hóa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Tổng SKU" value={products.length} />
                <Row label="Sắp hết (<50)" value={stats.lowStock} accent="warning" />
                <Row label="Hết hàng" value={stats.outOfStock} accent="destructive" />
                <Link href="/inventory" className="block pt-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl font-bold"
                  >
                    Quản lý kho hàng
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-outline-variant lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Đơn hàng gần đây
                </CardTitle>
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="gap-1.5 font-semibold">
                    Xem tất cả
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 py-6 text-sm text-on-surface-variant">
                    <ShoppingBag className="size-4 opacity-60" aria-hidden />
                    Chưa có đơn hàng nào
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 px-4 py-3 hover:bg-muted/20"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <ShoppingBag
                            className="mt-0.5 size-4 shrink-0 text-primary/80"
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-primary">{order.orderNumber}</p>
                            <p className="truncate text-xs text-on-surface-variant">
                              {order.customerName} · {order.items.length} mặt hàng
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-nowrap text-sm font-black">
                          {formatVND(order.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PageSection>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "warning" | "primary" | "success" | "default";
}) {
  const toneClass =
    tone === "warning"
      ? "border-warning/30 bg-warning/5"
      : tone === "primary"
        ? "border-primary/30 bg-primary/5"
        : tone === "success"
          ? "border-success/30 bg-success/5"
          : "border-outline-variant bg-surface";
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-semibold text-on-surface-variant">{label}</span></div>
      <p className="text-3xl font-black text-foreground">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "warning" | "destructive";
}) {
  const accentClass =
    accent === "warning"
      ? "text-warning"
      : accent === "destructive"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`font-black ${accentClass}`}>{value}</span>
    </div>
  );
}
