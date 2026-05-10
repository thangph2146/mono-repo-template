"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
  CheckCircle2,
  Truck,
  Clock,
  AlertCircle,
  Banknote,
  RefreshCw,
  RotateCcw,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { ApiError, type Order, type OrderStatus } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useOrders,
  useDispatchShippers,
  useAssignOrderShipper,
  useConfirmShipped,
  useConfirmDelivered,
  useCancelOrder,
  useReopenCancelledOrder,
} from "@/hooks/queries";
import { formatVND, formatDate } from "@/lib/format";
import {
  getOrderSubRows,
  ordersToTreeRows,
  type OrderTreeRow,
} from "@/lib/admin-orders-tree";
import { AdminDataTable } from "@/components/admin-data-table";

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
  const { user } = useAuth();
  const canWriteOrders = user
    ? canUserAccess(user, PERMISSION_CODES.ORDERS_WRITE)
    : false;
  const { data, isLoading, error, refetch, isFetching } = useOrders();
  const confirmShipped = useConfirmShipped();
  const confirmDelivered = useConfirmDelivered();
  const cancelOrder = useCancelOrder();
  const reopenCancelled = useReopenCancelledOrder();
  const { data: shippers = [] } = useDispatchShippers({
    enabled: canWriteOrders,
  });
  const assignShipperMutation = useAssignOrderShipper();

  const orders = useMemo(() => data ?? [], [data]);

  const [statusFilter, setStatusFilter] = useState<FilterKey>("ALL");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [actorRole, setActorRole] = useState("warehouse");
  const [actorName, setActorName] = useState("");

  const applyStatusTab = useCallback((key: FilterKey): void => {
    setStatusFilter(key);
    setColumnFilters((prev) => {
      const rest = prev.filter((f) => f.id !== "filterStatus");
      if (key === "ALL") return rest;
      return [...rest, { id: "filterStatus", value: key }];
    });
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater;
        const st = next.find((f) => f.id === "filterStatus")?.value;
        if (st != null && String(st) !== "") {
          setStatusFilter(String(st) as FilterKey);
        } else {
          setStatusFilter("ALL");
        }
        return next;
      });
    },
    [],
  );

  const actorLabel = useMemo(() => {
    const role =
      ROLE_OPTIONS.find((r) => r.value === actorRole)?.label ?? "Nhân viên";
    return actorName.trim() ? `${role} – ${actorName.trim()}` : role;
  }, [actorRole, actorName]);

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

  const onReopenCancelled = (order: Order): void => {
    if (
      !confirm(
        `Mở lại đơn ${order.orderNumber} về trạng thái “Chờ xử lý”? Tồn kho sẽ bị trừ lại theo từng dòng hàng.`,
      )
    ) {
      return;
    }
    toast.promise(
      reopenCancelled.mutateAsync({ id: order.id, actor: actorLabel }),
      {
        loading: `Đang mở lại ${order.orderNumber}...`,
        success: `${order.orderNumber} → Chờ xử lý (đã trừ tồn lại)`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không mở lại được đơn",
      },
    );
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
        return matchStatus;
      }),
    [orders, statusFilter],
  );

  const treeRows = useMemo(() => ordersToTreeRows(filtered), [filtered]);

  const orderColumns: ColumnDef<OrderTreeRow>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn / SKU",
      meta: { filterPlaceholder: "Lọc mã…" },
    },
    {
      accessorKey: "customerName",
      header: "Khách / Sản phẩm",
      meta: { filterPlaceholder: "Lọc tên…" },
    },
    {
      accessorKey: "customerPhone",
      header: "Điện thoại",
      cell: ({ getValue }) => (getValue() as string) || "—",
      meta: { filterPlaceholder: "SĐT…" },
    },
    {
      id: "qtyLine",
      accessorFn: (r) =>
        r.rowKind === "order" ? `${r.order.items.length} mặt hàng` : r.qtyLine,
      header: "Số lượng dòng",
      meta: { filterPlaceholder: "Lọc…" },
    },
    {
      accessorKey: "totalAmount",
      header: "Thành tiền",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return Number(row.getValue(id)) === Number(v);
      },
      cell: ({ getValue }) => formatVND(Number(getValue())),
      meta: { filterVariant: "number", filterPlaceholder: "Số tiền = …" },
    },
    {
      accessorKey: "filterStatus",
      header: "Trạng thái",
      cell: ({ row }) =>
        row.original.rowKind === "order"
          ? getStatusBadge(row.original.order.status)
          : null,
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        return row.getValue(id) === v;
      },
      meta: {
        filterVariant: "select",
        selectOptions: STATUS_FILTERS.filter((s) => s.key !== "ALL").map(
          (s) => ({
            value: s.key,
            label: s.hint ? `${s.label} — ${s.hint}` : s.label,
          }),
        ),
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row, getValue }) =>
        row.original.rowKind === "order"
          ? formatDate(getValue() as string)
          : "—",
      meta: { filterPlaceholder: "Chuỗi ngày…" },
    },
    {
      accessorKey: "paymentLabel",
      header: "Thanh toán / Đơn giá",
      filterFn: (row, id, v) => {
        if (v == null || v === "") return true;
        if (row.original.rowKind === "line") return true;
        return String(row.getValue(id)) === String(v);
      },
      meta: {
        filterVariant: "select",
        filterLabel: "Thanh toán (đơn)",
        selectOptions: [
          { value: "cod · Chưa thu", label: "COD · Chưa thu" },
          { value: "cod · Đã thu", label: "COD · Đã thu" },
        ],
      },
    },
    {
      accessorKey: "shipNote",
      header: "Địa chỉ giao",
      cell: ({ getValue }) => {
        const t = (getValue() as string) || "—";
        return (
          <span className="line-clamp-2 max-w-[200px] text-xs" title={t}>
            {t}
          </span>
        );
      },
      meta: { filterPlaceholder: "Lọc địa chỉ…" },
    },
    {
      id: "shipperAssign",
      header: "Shipper giao hàng",
      enableColumnFilter: false,
      cell: ({ row }) => {
        const r = row.original;
        if (r.rowKind !== "order") return null;
        const order = r.order;
        const assigned = order.assignedShipper;
        if (!canWriteOrders) {
          return (
            <span className="text-sm text-foreground">
              {assigned?.fullName ?? "—"}
            </span>
          );
        }
        return (
          <select
            className="h-9 w-full min-w-[11rem] max-w-[220px] rounded-lg border border-outline-variant bg-background px-2 text-sm font-medium"
            value={assigned?.id ?? ""}
            disabled={assignShipperMutation.isPending}
            aria-label={`Chọn shipper cho ${order.orderNumber}`}
            onChange={(e) => {
              const v = e.target.value;
              const shipperUserId = v === "" ? null : Number(v);
              toast.promise(
                assignShipperMutation.mutateAsync({
                  id: order.id,
                  shipperUserId,
                }),
                {
                  loading: "Đang cập nhật shipper…",
                  success: shipperUserId
                    ? `Đã gán shipper cho ${order.orderNumber}`
                    : `Đã bỏ gán shipper — ${order.orderNumber}`,
                  error: (err: unknown) =>
                    err instanceof ApiError
                      ? err.message
                      : "Không gán được shipper",
                },
              );
            }}
          >
            <option value="">— Chưa gán —</option>
            {shippers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.email})
              </option>
            ))}
          </select>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => {
        const r = row.original;
        if (r.rowKind !== "order") return null;
        const order = r.order;
        return (
          <div className="flex flex-col gap-2 items-stretch min-w-[200px]">
            {canWriteOrders &&
              (order.status === "pending" || order.status === "confirmed") && (
                <>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white font-bold rounded-lg"
                    onClick={() => onConfirmShipped(order)}
                    disabled={confirmShipped.isPending}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    {order.status === "pending"
                      ? "Kho xác nhận"
                      : "Bàn giao shipper"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-destructive border-destructive/30"
                    onClick={() => onCancel(order)}
                    disabled={cancelOrder.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Huỷ đơn
                  </Button>
                </>
              )}
            {canWriteOrders && order.status === "shipped" && (
              <>
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90 text-white font-bold rounded-lg"
                  onClick={() => onConfirmDelivered(order)}
                  disabled={confirmDelivered.isPending}
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Thu tiền COD
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-destructive border-destructive/30"
                  onClick={() => onCancel(order)}
                  disabled={cancelOrder.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" /> Huỷ
                </Button>
              </>
            )}
            {order.status === "delivered" && (
              <span className="text-xs text-success font-semibold">
                Đã hoàn tất
              </span>
            )}
            {order.status === "cancelled" && canWriteOrders && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-primary/30 text-primary"
                onClick={() => onReopenCancelled(order)}
                disabled={reopenCancelled.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Mở lại đơn (về Chờ xử lý)
              </Button>
            )}
            {order.status === "cancelled" && !canWriteOrders && (
              <span className="text-xs text-destructive font-semibold">
                Đã huỷ
              </span>
            )}
          </div>
        );
      },
    },
  ];

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
            Chỉ định shipper ở cột tương ứng (user phải có role{" "}
            <span className="font-mono text-foreground">shipper</span> trong RBAC).
            Luồng: kho xác nhận → giao hàng &amp; thu COD → hoàn tất.
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

      {canWriteOrders && (
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
      )}

      {user && !canWriteOrders && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 text-sm text-amber-900 dark:text-amber-100/90">
          <p className="font-semibold">Chế độ chỉ xem đơn</p>
          <p className="mt-1 opacity-90">
            Tài khoản không có{" "}
            <span className="font-mono">orders.write</span> — không thể xác
            nhận xuất kho, giao hàng hay huỷ đơn trên API.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.key}
            onClick={() => applyStatusTab(f.key)}
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

      <p className="text-sm text-on-surface-variant">
        Bảng: cây <span className="font-semibold">đơn → dòng hàng</span>. Chip trạng
        thái và ô lọc cột « Trạng thái » luôn đồng bộ; thêm lọc/tìm nhanh trên tập
        đã chọn.
      </p>

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

      {!error && (
        <AdminDataTable<OrderTreeRow>
          data={treeRows}
          columns={orderColumns}
          getSubRows={getOrderSubRows}
          isLoading={isLoading}
          emptyLabel="Không có đơn phù hợp chip / bộ lọc."
          defaultExpandedAll={false}
          columnFilters={columnFilters}
          onColumnFiltersChange={handleColumnFiltersChange}
          getGlobalFilterText={(r) =>
            [
              r.orderNumber,
              r.customerName,
              r.customerPhone,
              r.shipNote,
              r.paymentLabel,
              r.filterStatus,
            ].join(" ")
          }
          globalFilterPlaceholder="Tìm mã đơn, khách, SĐT, địa chỉ…"
          getRowClassName={(row) =>
            row.original.rowKind === "order"
              ? row.original.order.status === "pending"
                ? "bg-warning/5"
                : row.original.order.status === "delivered"
                  ? "bg-success/5"
                  : row.original.order.status === "cancelled"
                    ? "bg-destructive/5"
                    : "bg-primary/5"
              : undefined
          }
        />
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
