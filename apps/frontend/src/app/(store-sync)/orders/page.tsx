"use client";

import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Card, CardContent } from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  Package,
  Search,
  RefreshCw,
  Truck,
  OctagonX,
  PackagePlus,
  CircleCheckBig,
  Layers,
} from "lucide-react";
import type { OrderStatus } from "@/lib/api";
import { useOrders } from "@/hooks/queries";
import { useSession } from "@/hooks/use-session";
import { formatVND, formatDateShort } from "@/lib/format";
import { OrderStatusTable } from "@/components/shared/order-status-table";
import type { OrderStatusTableRow } from "@/components/shared/order-status-table";

type StatusKey = "ALL" | "SHIPPING" | "COMPLETED" | "CANCELLED";

const STATUS_OPTS: {
  key: StatusKey;
  label: string;
  shortLabel: string;
  icon: typeof Package;
  tone: string;
}[] = [
  {
    key: "ALL",
    label: "Tất cả",
    shortLabel: "Tất cả đơn",
    icon: Layers,
    tone: "text-foreground bg-muted",
  },
  {
    key: "SHIPPING",
    label: "Đang giao",
    shortLabel: "Đang giao",
    icon: Truck,
    tone: "text-primary bg-primary/10",
  },
  {
    key: "COMPLETED",
    label: "Đã giao",
    shortLabel: "Đã giao",
    icon: CircleCheckBig,
    tone: "text-success bg-success/15",
  },
  {
    key: "CANCELLED",
    label: "Đã hủy",
    shortLabel: "Đã hủy",
    icon: OctagonX,
    tone: "text-destructive bg-destructive/10",
  },
];

const toStatusKey = (status: OrderStatus): StatusKey => {
  if (
    status === "shipped" ||
    status === "confirmed" ||
    status === "pending"
  ) {
    return "SHIPPING";
  }
  if (status === "delivered") return "COMPLETED";
  if (status === "cancelled") return "CANCELLED";
  return "SHIPPING";
};

const toTableStatus = (
  key: StatusKey,
): OrderStatusTableRow["status"] => {
  if (key === "COMPLETED") return "completed";
  if (key === "CANCELLED") return "cancelled";
  return "shipping";
};

export default function OrdersPage() {
  const router = useRouter();
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 280);
  const [statusFilter, setStatusFilter] = useState<StatusKey>("ALL");

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session, router]);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useOrders(session?.username);
  const orders = useMemo(() => data ?? [], [data]);

  const enrichedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        statusKey: toStatusKey(order.status),
      })),
    [orders],
  );

  const filteredOrders = useMemo(
    () =>
      enrichedOrders.filter((order) => {
        const matchStatus =
          statusFilter === "ALL" || order.statusKey === statusFilter;
        const q = debouncedSearch.trim().toLowerCase();
        const matchSearch =
          !q ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerEmail.toLowerCase().includes(q) ||
          (order.customerPhone ?? "").toLowerCase().includes(q) ||
          (order.shippingAddress ?? "").toLowerCase().includes(q) ||
          order.items.some(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.sku.toLowerCase().includes(q),
          );
        return matchStatus && matchSearch;
      }),
    [enrichedOrders, debouncedSearch, statusFilter],
  );

  const tableRows = useMemo((): OrderStatusTableRow[] => {
    return filteredOrders.map((order) => {
      const label =
        STATUS_OPTS.find((o) => o.key === order.statusKey)?.label ?? "—";
      const etaOrTotal =
        order.statusKey === "CANCELLED"
          ? "Đơn đã hủy"
          : `Tổng: ${formatVND(order.totalAmount)}`;
      return {
        rowKey: String(order.id),
        orderCode: order.orderNumber,
        date: formatDateShort(order.createdAt),
        statusText: label,
        etaOrTotal,
        status: toTableStatus(order.statusKey),
        href: `/orders/${order.id}`,
        ctaLabel: order.statusKey === "COMPLETED" ? "Mua lại" : "Chi tiết",
      };
    });
  }, [filteredOrders]);

  const hasOrderFilters =
    statusFilter !== "ALL" || Boolean(searchTerm.trim());

  const counts: Record<StatusKey, number> = {
    ALL: enrichedOrders.length,
    SHIPPING: enrichedOrders.filter((o) => o.statusKey === "SHIPPING").length,
    COMPLETED: enrichedOrders.filter((o) => o.statusKey === "COMPLETED")
      .length,
    CANCELLED: enrichedOrders.filter((o) => o.statusKey === "CANCELLED")
      .length,
  };

  if (!session) return null;

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  Đơn hàng của tôi
                </h1>
                <p className="text-lg text-muted-foreground">
                  Theo dõi tiến độ giao nhận — sỉ &amp; lẻ
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:shrink-0">
                <Link href="/catalog" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="h-12 px-6 rounded-xl font-bold w-full sm:w-auto"
                  >
                    <PackagePlus className="w-5 h-5 mr-2" />
                    Đặt hàng mới
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => void refetch()}
                  className="h-12 px-6 rounded-xl font-bold border-outline-variant"
                >
                  <RefreshCw
                    className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {STATUS_OPTS.map((opt) => {
                const active = statusFilter === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStatusFilter(opt.key)}
                    className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Card
                      className={`border-outline-variant bg-background h-full transition-all cursor-pointer ${
                        active
                          ? "border-primary shadow-md ring-1 ring-primary/20"
                          : "hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">
                            {opt.shortLabel}
                          </p>
                          <p className="text-3xl font-black text-foreground mt-1 tabular-nums">
                            {counts[opt.key]}
                          </p>
                        </div>
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${opt.tone}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
            </div>

            <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-outline-variant flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
              <div className="relative flex-grow w-full min-w-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  aria-label="Tìm đơn hàng"
                  placeholder="Mã đơn, email, SĐT, địa chỉ, SKU, tên hàng…"
                  className="pl-12 h-12 text-base bg-background border-outline-variant rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm.trim() && debouncedSearch !== searchTerm ? (
                  <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
                    Đang lọc…
                  </p>
                ) : null}
              </div>
              {hasOrderFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl font-semibold border-outline-variant shrink-0"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                  }}
                >
                  Xóa lọc
                </Button>
              ) : null}
            </div>

            {error && (
              <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <p className="text-lg font-bold text-destructive">
                  Không tải được đơn hàng
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
              </div>
            )}

            {loading && !error && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="mt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-2xl font-bold text-foreground">
                    Danh sách đơn hàng
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredOrders.length} đơn
                    {hasOrderFilters ? " khớp bộ lọc" : ""}
                  </p>
                </div>

                {filteredOrders.length > 0 ? (
                  <OrderStatusTable rows={tableRows} />
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-outline-variant">
                    <Package className="w-20 h-20 text-muted-foreground mx-auto mb-6 opacity-20" />
                    <h3 className="text-2xl font-bold text-muted-foreground">
                      Không có đơn hàng phù hợp
                    </h3>
                    <p className="text-muted-foreground mt-2">
                      Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
                    </p>
                    <Link href="/catalog">
                      <Button
                        className="mt-8 h-12 px-8 text-base font-bold rounded-xl"
                        size="lg"
                      >
                        <PackagePlus className="w-5 h-5 mr-2" />
                        Đến danh mục sản phẩm
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
