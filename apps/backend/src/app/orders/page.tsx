"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
  Search,
  CalendarDays,
  Filter,
  CheckCircle2,
  Truck,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Box,
  Package2,
  Store,
  Banknote,
  RefreshCw,
  XCircle,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { ApiError, type Order, type OrderStatus } from "@/lib/api";
import {
  useOrders,
  useConfirmShipped,
  useConfirmDelivered,
  useCancelOrder,
} from "@/hooks/queries";
import { formatVND, formatDate } from "@/lib/format";

type FilterKey =
  | "ALL"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

const STATUS_FILTERS: { key: FilterKey; label: string; hint: string }[] = [
  { key: "ALL", label: "Tất cả", hint: "" },
  { key: "pending", label: "Chờ xử lý", hint: "Cần kho xác nhận" },
  { key: "confirmed", label: "Đã chốt kho", hint: "Sẵn sàng xuất kho" },
  { key: "shipped", label: "Đang giao", hint: "Đợi shipper trao hàng" },
  { key: "delivered", label: "Hoàn tất", hint: "Đã thu tiền COD" },
  { key: "cancelled", label: "Đã huỷ", hint: "Đã hoàn lại tồn kho" },
];

const ROLE_OPTIONS = [
  { value: "warehouse", label: "Nhân viên kho" },
  { value: "delivery", label: "Nhân viên giao hàng" },
  { value: "admin", label: "Quản trị viên" },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã chốt kho",
  shipped: "Đang giao",
  delivered: "Đã giao & thu tiền",
  cancelled: "Đã huỷ",
};

export default function AdminOrdersPage() {
  const { data, isLoading, error, refetch, isFetching } = useOrders();
  const confirmShipped = useConfirmShipped();
  const confirmDelivered = useConfirmDelivered();
  const cancelOrder = useCancelOrder();

  const orders = useMemo(() => data ?? [], [data]);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterKey>("ALL");
  const [actorRole, setActorRole] = useState("warehouse");
  const [actorName, setActorName] = useState("");

  const actorLabel = useMemo(() => {
    const role =
      ROLE_OPTIONS.find((r) => r.value === actorRole)?.label ?? "Nhân viên";
    return actorName.trim() ? `${role} – ${actorName.trim()}` : role;
  }, [actorRole, actorName]);

  const toggleExpand = (id: number): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onConfirmShipped = (order: Order): void => {
    toast.promise(
      confirmShipped.mutateAsync({ id: order.id, actor: actorLabel }),
      {
        loading: `Đang xác nhận xuất kho ${order.orderNumber}...`,
        success: `${order.orderNumber} → đã xuất kho / đang giao`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Lỗi cập nhật trạng thái",
      },
    );
  };

  const onConfirmDelivered = (order: Order): void => {
    toast.promise(
      confirmDelivered.mutateAsync({ id: order.id, actor: actorLabel }),
      {
        loading: `Đang xác nhận thu tiền ${order.orderNumber}...`,
        success: `${order.orderNumber} → đã giao & thu đủ tiền COD`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Lỗi cập nhật trạng thái",
      },
    );
  };

  const onCancel = (order: Order): void => {
    if (!confirm(`Huỷ đơn ${order.orderNumber}? Tồn kho sẽ được hoàn lại.`)) {
      return;
    }
    toast.promise(cancelOrder.mutateAsync({ id: order.id, actor: actorLabel }), {
      loading: `Đang huỷ ${order.orderNumber}...`,
      success: `${order.orderNumber} đã huỷ – kho đã hoàn`,
      error: (err: unknown) =>
        err instanceof ApiError ? err.message : "Lỗi huỷ đơn",
    });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const map: Record<
      OrderStatus,
      { className: string; icon: typeof Truck }
    > = {
      pending: {
        className: "bg-warning/15 text-warning border-warning/20",
        icon: Clock,
      },
      confirmed: {
        className: "bg-blue-500/15 text-blue-600 border-blue-400/30",
        icon: ShieldCheck,
      },
      shipped: {
        className: "bg-primary/15 text-primary border-primary/20",
        icon: Truck,
      },
      delivered: {
        className: "bg-success/15 text-success border-success/20",
        icon: CheckCircle2,
      },
      cancelled: {
        className: "bg-destructive/15 text-destructive border-destructive/20",
        icon: XCircle,
      },
    };
    const cfg = map[status];
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.className} px-3 py-1 font-bold`}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {STATUS_LABEL[status]}
      </Badge>
    );
  };

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
        const q = searchTerm.toLowerCase().trim();
        const matchSearch =
          !q ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.customerPhone ?? "").toLowerCase().includes(q);
        return matchStatus && matchSearch;
      }),
    [orders, statusFilter, searchTerm],
  );

  const counts = useMemo(() => {
    const base: Record<FilterKey, number> = {
      ALL: orders.length,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) base[o.status as FilterKey]++;
    return base;
  }, [orders]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Quản lý Đơn hàng (COD)
          </h1>
          <p className="text-lg text-on-surface-variant font-medium mt-1">
            Kho xác nhận xuất hàng → Shipper giao &amp; thu tiền → Đơn hoàn tất
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refetch()}
          className="flex items-center gap-2 border-outline-variant h-12 px-6 rounded-xl font-bold hover:bg-muted"
        >
          <RefreshCw
            className={`w-5 h-5 ${isFetching ? "animate-spin" : ""}`}
          />{" "}
          Làm mới
        </Button>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Vai trò xác nhận
          </p>
          <div className="flex gap-2 flex-wrap">
            {ROLE_OPTIONS.map((r) => (
              <Button
                key={r.value}
                onClick={() => setActorRole(r.value)}
                className={`h-10 px-4 rounded-xl text-sm font-bold border ${
                  actorRole === r.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-on-surface-variant border-outline-variant hover:bg-muted"
                }`}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Tên người xác nhận (lưu vào audit log)
          </p>
          <Input
            placeholder="VD: Nguyễn Văn A"
            value={actorName}
            onChange={(e) => setActorName(e.target.value)}
            className="rounded-xl bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-2xl p-4 h-auto text-left flex-col items-start border transition-all ${
              statusFilter === f.key
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-surface border-outline-variant hover:bg-muted"
            }`}
          >
            <p
              className={`text-2xl font-black ${
                statusFilter === f.key ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {counts[f.key]}
            </p>
            <p
              className={`text-xs font-semibold mt-1 ${
                statusFilter === f.key
                  ? "text-primary-foreground/70"
                    : "text-muted-foreground"
              }`}
            >
              {f.label}
            </p>
            {f.hint && (
              <p
                className={`text-[10px] mt-0.5 ${
                  statusFilter === f.key
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {f.hint}
              </p>
            )}
          </Button>
        ))}
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
          <Input
            placeholder="Tìm mã đơn, tên khách, số điện thoại..."
            className="pl-12 py-6 text-base bg-background border-outline-variant rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-background border-outline-variant font-bold px-6 h-12 rounded-xl hover:bg-muted"
          >
            <CalendarDays className="w-5 h-5" /> Hôm nay
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-background border-outline-variant font-bold px-6 h-12 rounded-xl hover:bg-muted"
          >
            <Filter className="w-5 h-5" /> Lọc nâng cao
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <p className="text-lg font-bold text-destructive">
            Không tải được đơn hàng
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            {error.message}
          </p>
        </div>
      )}

      {isLoading && !error && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4">
          {filtered.map((order) => {
            const expanded = expandedIds.has(order.id);
            return (
              <div
                key={order.id}
                className="bg-background rounded-2xl border border-outline-variant shadow-sm overflow-hidden"
              >
                <div
                  className={`flex flex-wrap items-center gap-3 px-6 py-4 cursor-pointer select-none transition-colors ${
                    order.status === "pending"
                      ? "bg-warning/5 hover:bg-warning/10"
                      : order.status === "delivered"
                        ? "bg-success/5 hover:bg-success/10"
                        : order.status === "cancelled"
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : "bg-primary/5 hover:bg-primary/10"
                  }`}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <span className="font-black text-lg text-primary shrink-0">
                      {order.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium text-sm min-w-0">
                      <Store className="w-4 h-4 shrink-0" />
                      <span className="truncate">{order.customerName}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="hidden md:flex items-center gap-1.5 text-on-surface-variant text-xs">
                        <Phone className="w-3.5 h-3.5" />
                        {order.customerPhone}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <span className="text-sm text-on-surface-variant font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="font-black text-lg text-foreground">
                      {formatVND(order.totalAmount)}
                    </span>
                    {getStatusBadge(order.status)}
                    {expanded ? (
                      <ChevronUp className="w-5 h-5 text-outline shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-outline shrink-0" />
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="px-6 py-5 space-y-4 border-t border-outline-variant/30">
                    {order.shippingAddress && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-muted/30 rounded-xl px-4 py-2.5">
                        <Package2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium">
                          {order.shippingAddress}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl border border-outline-variant/40 bg-surface p-3">
                        <p className="text-xs uppercase text-on-surface-variant tracking-wide">
                          Xuất kho
                        </p>
                        <p className="font-bold mt-1">
                          {order.shippedAt
                            ? `${order.shippedBy ?? "—"} · ${formatDate(order.shippedAt)}`
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-outline-variant/40 bg-surface p-3">
                        <p className="text-xs uppercase text-on-surface-variant tracking-wide">
                          Giao &amp; thu tiền
                        </p>
                        <p className="font-bold mt-1">
                          {order.deliveredAt
                            ? `${order.deliveredBy ?? "—"} · ${formatDate(order.deliveredAt)}`
                            : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-outline-variant/40 bg-surface p-3">
                        <p className="text-xs uppercase text-on-surface-variant tracking-wide">
                          Thanh toán
                        </p>
                        <p className="font-bold mt-1 flex items-center gap-1">
                          <Banknote className="w-4 h-4 text-primary" />
                          {order.paymentMethod === "cod"
                            ? "COD"
                            : order.paymentMethod}{" "}
                          ·{" "}
                          {order.paymentStatus === "paid"
                            ? "Đã thu"
                            : "Chưa thu"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                        Chi tiết hàng hoá ({order.items.length} mặt hàng)
                      </p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={`${order.id}-${idx}`}
                            className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface/60 px-4 py-3"
                          >
                            <div className="w-12 h-12 rounded-lg border border-outline-variant/40 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt=""
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <Box className="w-6 h-6 text-outline-variant" />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="font-bold text-sm text-foreground line-clamp-1">
                                {item.name}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge className="text-[10px] px-1.5 py-0 bg-muted text-on-surface-variant border-outline-variant/40 font-semibold">
                                  {item.sku}
                                </Badge>
                                <span className="text-xs text-on-surface-variant font-medium">
                                  {item.unitType}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-primary text-base">
                                {formatVND(item.totalPrice)}
                              </p>
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                × {item.quantity} {item.unitType}
                                {item.qtyPerUnit && item.qtyPerUnit > 1
                                  ? ` (~${item.quantity * item.qtyPerUnit} đơn vị nhỏ)`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-outline-variant/20">
                      {(order.status === "pending" ||
                        order.status === "confirmed") && (
                        <>
                          <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 shadow"
                            onClick={() => onConfirmShipped(order)}
                            disabled={confirmShipped.isPending}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            {order.status === "pending"
                              ? "Kho xác nhận xuất hàng"
                              : "Bàn giao shipper"}
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl px-4 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => onCancel(order)}
                            disabled={cancelOrder.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Huỷ đơn
                          </Button>
                        </>
                      )}
                      {order.status === "shipped" && (
                        <>
                          <Button
                            className="bg-success hover:bg-success/90 text-white font-bold rounded-xl px-6 shadow"
                            onClick={() => onConfirmDelivered(order)}
                            disabled={confirmDelivered.isPending}
                          >
                            <Banknote className="w-4 h-4 mr-2" />
                            Đã giao &amp; Thu đủ tiền COD
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl px-4 font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => onCancel(order)}
                            disabled={cancelOrder.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Huỷ
                          </Button>
                        </>
                      )}
                      {order.status === "delivered" && (
                        <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/5 py-2 px-4 rounded-xl border border-success/20">
                          <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất –
                          Kho đã trừ &amp; tiền đã thu
                        </div>
                      )}
                      {order.status === "cancelled" && (
                        <div className="flex items-center gap-2 text-destructive font-bold text-sm bg-destructive/5 py-2 px-4 rounded-xl border border-destructive/20">
                          <XCircle className="w-4 h-4" /> Đơn đã huỷ – tồn kho
                          đã hoàn lại
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-outline-variant">
              <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-20 mb-4" />
              <p className="text-xl font-bold text-on-surface-variant">
                Không có đơn hàng phù hợp
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">
            Quy trình COD áp dụng:
          </p>
          <p className="text-on-surface-variant leading-relaxed text-sm">
            <span className="font-semibold">
              Chờ xử lý → Đã chốt kho → Đang giao → Đã giao &amp; thu tiền
            </span>
            . Tồn kho được giữ chỗ ngay khi đơn được tạo và sẽ được hoàn lại
            nếu huỷ. Khi shipper xác nhận đã thu tiền, đơn chuyển{" "}
            <span className="font-bold text-success">
              &ldquo;Đã giao &amp; Thu tiền&rdquo;
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
