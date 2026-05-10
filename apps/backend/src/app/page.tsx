"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
  Package2,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { useOrders, useProducts } from "@/hooks/queries";
import { formatVND } from "@/lib/format";

export default function AdminDashboardPage() {
  const productsResource = useProducts();
  const ordersResource = useOrders();

  const products = useMemo(
    () => productsResource.data ?? [],
    [productsResource.data],
  );
  const orders = useMemo(
    () => ordersResource.data ?? [],
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

  const loading = productsResource.isLoading || ordersResource.isLoading;
  const error = productsResource.error ?? ordersResource.error;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Tổng quan vận hành</h1>
        <p className="text-lg text-on-surface-variant font-medium mt-1">
          Theo dõi nhanh tồn kho và đơn hàng theo thời gian thực
        </p>
      </div>

      {error && (
        <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <p className="text-lg font-bold text-destructive">Không tải được dữ liệu</p>
          <p className="text-sm text-on-surface-variant mt-1">{error.message}</p>
        </div>
      )}

      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !error && (
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
                  <Button variant="outline" className="w-full rounded-xl font-bold">
                    Quản lý kho hàng
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
                  <Button variant="ghost" size="sm" className="font-semibold">
                    Xem tất cả
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-6">
                    Chưa có đơn hàng nào
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl border border-outline-variant/30 px-4 py-3 hover:bg-muted/20"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-primary">{order.orderNumber}</p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {order.customerName} · {order.items.length} mặt hàng
                          </p>
                        </div>
                        <p className="font-black text-sm whitespace-nowrap">
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
    </div>
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
