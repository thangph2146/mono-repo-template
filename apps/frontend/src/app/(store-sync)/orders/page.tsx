"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
  Package,
  Search,
  RefreshCw,
  ChevronDown,
  Filter,
  Truck,
  CheckCircle2,
  Clock3,
  Eye,
  ShoppingCart,
  Box,
  OctagonXIcon,
} from "lucide-react";
import type { OrderStatus } from "@/lib/api";
import { useOrders } from "@/hooks/queries";
import { useSession } from "@/hooks/use-session";
import { formatVND, formatDate } from "@/lib/format";

type StatusKey = "ALL" | "SHIPPING" | "COMPLETED" | "CANCELLED";

const STATUS_OPTS: {
  key: StatusKey;
  label: string;
  color: string;
  dot: string;
}[] = [
  { key: "ALL", label: "Tất cả", color: "bg-muted text-foreground border-outline-variant", dot: "bg-outline-variant" },
  { key: "SHIPPING", label: "Đang giao", color: "bg-blue-500/15 text-blue-600 border-blue-400/30", dot: "bg-blue-500" },
  { key: "COMPLETED", label: "Đã giao", color: "bg-emerald-500/15 text-emerald-700 border-emerald-400/30", dot: "bg-emerald-500" },
  { key: "CANCELLED", label: "Đã hủy", color: "bg-red-500/15 text-red-600 border-red-400/30", dot: "bg-red-500" },
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

function StatusBadge({ statusKey }: { statusKey: StatusKey }) {
  const opt = STATUS_OPTS.find((o) => o.key === statusKey)!;
  const Icon =
    statusKey === "SHIPPING"
      ? Truck
      : statusKey === "COMPLETED"
        ? CheckCircle2
        : statusKey === "CANCELLED"
          ? OctagonXIcon
          : Package;
  return (
    <Badge className={`${opt.color} font-bold px-3 py-1 border`}>
      <Icon className="w-3.5 h-3.5 mr-1.5" />
      {opt.label}
    </Badge>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const session = useSession();
  const [searchTerm, setSearchTerm] = useState("");
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
        const q = searchTerm.trim().toLowerCase();
        const matchSearch =
          !q ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.items.some(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.sku.toLowerCase().includes(q),
          );
        return matchStatus && matchSearch;
      }),
    [enrichedOrders, searchTerm, statusFilter],
  );

  const counts: Record<StatusKey, number> = {
    ALL: enrichedOrders.length,
    SHIPPING: enrichedOrders.filter((o) => o.statusKey === "SHIPPING").length,
    COMPLETED: enrichedOrders.filter((o) => o.statusKey === "COMPLETED").length,
    CANCELLED: enrichedOrders.filter((o) => o.statusKey === "CANCELLED").length,
  };

  const headerBg: Record<StatusKey, string> = {
    ALL: "bg-muted/30",
    SHIPPING: "bg-blue-500/5 border-blue-400/20",
    COMPLETED: "bg-emerald-500/5 border-emerald-400/20",
    CANCELLED: "bg-red-500/5 border-red-400/20",
  };

  if (!session) return null;

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                  <Package className="w-10 h-10 text-primary" />
                  Đơn hàng của tôi
                </h1>
                <p className="text-lg text-on-surface-variant font-medium mt-1">
                  Theo dõi tiến độ giao nhận – sỉ &amp; lẻ
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => void refetch()}
                className="flex items-center gap-2 border-outline-variant h-12 px-6 rounded-xl font-bold hover:bg-muted"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} /> Cập nhật mới nhất
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATUS_OPTS.map((opt) => {
                const active = statusFilter === opt.key;
                const Icon =
                  opt.key === "SHIPPING"
                    ? Truck
                    : opt.key === "COMPLETED"
                      ? CheckCircle2
                      : opt.key === "CANCELLED"
                        ? OctagonXIcon
                        : Package;
                return (
                  <Button
                    key={opt.key}
                    onClick={() => setStatusFilter(opt.key)}
                    className={`rounded-2xl p-4 h-auto text-left flex-col items-start border transition-all ${
                      active
                        ? `${opt.color} shadow-md`
                        : "bg-surface border-outline-variant hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                      <span className={`text-xs font-semibold ${active ? "" : "text-on-surface-variant"}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className={`text-3xl font-black ${active ? "" : "text-foreground"}`}>{counts[opt.key]}</p>
                    <Icon className="w-4 h-4 mt-1 opacity-50" />
                  </Button>
                );
              })}
            </div>

            <div className="bg-surface p-5 rounded-2xl border border-outline-variant flex flex-col lg:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                <Input
                  placeholder="Tìm mã đơn, SKU, tên sản phẩm..."
                  className="pl-12 py-6 text-base bg-background border-outline-variant rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto h-12 rounded-xl border-outline-variant font-semibold"
                    />
                  }
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {STATUS_OPTS.find((o) => o.key === statusFilter)?.label ?? "Tất cả"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {STATUS_OPTS.map((opt) => (
                    <DropdownMenuItem key={opt.key} onClick={() => setStatusFilter(opt.key)}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${opt.dot}`} />
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {error && (
              <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <p className="text-lg font-bold text-destructive">Không tải được đơn hàng</p>
                <p className="text-sm text-on-surface-variant mt-1">{error.message}</p>
              </div>
            )}

            {loading && !error && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-background border rounded-2xl overflow-hidden shadow-sm transition-all ${
                      order.statusKey === "CANCELLED"
                        ? "border-red-300/40 opacity-80"
                        : "border-outline-variant hover:shadow-md"
                    }`}
                  >
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-outline-variant/30 ${headerBg[order.statusKey]}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-black text-lg text-primary">{order.orderNumber}</span>
                        <span className="text-sm text-on-surface-variant">·</span>
                        <span className="text-sm text-on-surface-variant font-medium flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge statusKey={order.statusKey} />
                        <span
                          className={`font-black text-xl ${
                            order.statusKey === "CANCELLED"
                              ? "line-through text-on-surface-variant"
                              : "text-foreground"
                          }`}
                        >
                          {formatVND(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-3 bg-muted/10 border-b border-outline-variant/20 flex flex-wrap gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Truck
                          className={`w-4 h-4 ${order.statusKey === "CANCELLED" ? "text-red-500" : "text-primary"}`}
                        />
                        {order.status}
                      </span>
                      {order.shippingAddress && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Package className="w-4 h-4 text-primary" />
                          {order.shippingAddress}
                        </span>
                      )}
                    </div>

                    <div className="px-6 py-4 space-y-2">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">
                        Chi tiết hàng hóa ({order.items.length} mặt hàng):
                      </p>
                      {order.items.map((item, idx) => (
                        <div
                          key={`${order.id}-${idx}`}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                            order.statusKey === "CANCELLED"
                              ? "border-red-200/30 bg-red-50/30 opacity-60"
                              : "border-outline-variant/30 bg-surface/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-outline-variant/40 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image ? (
                                <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <Box className="w-5 h-5 text-outline-variant" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground line-clamp-1">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className="text-[10px] px-1.5 py-0 bg-muted text-on-surface-variant border-outline-variant/40">
                                  {item.sku}
                                </Badge>
                                <span className="text-xs text-on-surface-variant font-medium">{item.unitType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-primary">{formatVND(item.totalPrice)}</p>
                            <p className="text-xs text-on-surface-variant">
                              x {item.quantity} {item.unitType}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-6 pb-5 flex flex-wrap gap-3 justify-end border-t border-outline-variant/20 pt-4">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl border-outline-variant font-semibold">
                          <Eye className="w-4 h-4 mr-2" /> Chi tiết đơn
                        </Button>
                      </Link>
                      {order.statusKey !== "CANCELLED" ? (
                        <Link href="/catalog">
                          <Button size="sm" className="rounded-xl font-bold">
                            <ShoppingCart className="w-4 h-4 mr-2" /> Đặt lại
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/catalog">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl font-bold border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" /> Đặt lại đơn này
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-outline-variant">
                    <Package className="w-20 h-20 text-outline-variant mx-auto mb-6 opacity-20" />
                    <h3 className="text-2xl font-bold text-on-surface-variant">Không có đơn hàng phù hợp</h3>
                    <p className="text-outline mt-2">Thử thay đổi từ khóa hoặc bộ lọc trạng thái.</p>
                    <Link href="/catalog">
                      <Button className="mt-8 h-14 px-10 text-lg font-bold rounded-xl" size="lg">
                        Đến trang Sản phẩm
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
