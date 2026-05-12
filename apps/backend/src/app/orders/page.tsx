"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ArchiveRestore,
  Archive,
  FilterX,
  Loader2,
  Layers,
  Trash2,
} from "lucide-react";
import { ApiError, type Order, type OrderStatus } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import {
  useOrders,
  useOrderStatusCounts,
  useTrashedOrders,
  useArchiveOrder,
  usePurgeTrashedOrder,
  useRestoreOrder,
  useDispatchShippers,
  useAssignOrderShipper,
  useConfirmShipped,
  useConfirmDelivered,
  useCancelOrder,
  useReopenCancelledOrder,
} from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { formatVND, formatDate } from "@/lib/format";
import {
  getOrderSubRows,
  ordersToTreeRows,
  type OrderTreeRow,
} from "@/lib/admin-orders-tree";
import { AdminDataTable } from "@/components/admin-data-table";
import { AdminTablePaginationFooter } from "@/components/admin-table-pagination-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { cn } from "@ui/lib/utils";

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
  const canReadOrders = user
    ? canUserAccess(user, PERMISSION_CODES.ORDERS_READ)
    : false;
  const canWriteOrders = user
    ? canUserAccess(user, PERMISSION_CODES.ORDERS_WRITE)
    : false;
  const [mainTab, setMainTab] = useState<"list" | "trash">("list");
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedQ = useDebouncedValue(globalFilter, 350);
  const [trashPage, setTrashPage] = useState(1);
  const [trashPageSize, setTrashPageSize] = useState(20);
  const [trashGlobalFilter, setTrashGlobalFilter] = useState("");
  const debouncedTrashQ = useDebouncedValue(trashGlobalFilter, 350);

  const [statusFilter, setStatusFilter] = useState<FilterKey>("ALL");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [actorRole, setActorRole] = useState("warehouse");
  const [actorName, setActorName] = useState("");

  const { data: statusCounts } = useOrderStatusCounts({
    enabled: canReadOrders,
  });

  const ordersListParams = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      page: listPage,
      limit: listPageSize,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    }),
    [debouncedQ, listPage, listPageSize, statusFilter],
  );

  const { data, isLoading, error, refetch, isFetching } = useOrders({
    enabled: canReadOrders && mainTab === "list",
    listParams: ordersListParams,
  });

  const trashListParams = useMemo(
    () => ({
      page: trashPage,
      limit: trashPageSize,
      q: debouncedTrashQ.trim() || undefined,
    }),
    [trashPage, trashPageSize, debouncedTrashQ],
  );

  const {
    data: trashedData,
    isLoading: trashedLoading,
    error: trashedError,
  } = useTrashedOrders({
    enabled: canWriteOrders && mainTab === "trash",
    listParams: trashListParams,
  });
  const trashedOrders = trashedData?.items ?? [];
  const trashTotal = trashedData?.total ?? 0;

  const confirmShipped = useConfirmShipped();
  const confirmDelivered = useConfirmDelivered();
  const cancelOrder = useCancelOrder();
  const reopenCancelled = useReopenCancelledOrder();
  const archiveOrder = useArchiveOrder();
  const restoreOrder = useRestoreOrder();
  const purgeTrashedOrder = usePurgeTrashedOrder();
  const { data: shippers = [] } = useDispatchShippers({
    enabled: canWriteOrders,
  });
  const assignShipperMutation = useAssignOrderShipper();

  const orders = useMemo(() => data?.items ?? [], [data?.items]);
  const totalList = data?.total ?? 0;

  const [archiveTarget, setArchiveTarget] = useState<Order | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Order | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [reopenTarget, setReopenTarget] = useState<Order | null>(null);

  useEffect(() => {
    setListPage(1);
  }, [debouncedQ, statusFilter, listPageSize]);

  useEffect(() => {
    setTrashPage(1);
  }, [debouncedTrashQ, mainTab, trashPageSize]);

  useEffect(() => {
    if (!canWriteOrders && mainTab === "trash") setMainTab("list");
  }, [canWriteOrders, mainTab]);

  const applyStatusTab = useCallback((key: FilterKey): void => {
    setStatusFilter(key);
  }, []);

  const clearListFilters = useCallback((): void => {
    setColumnFilters([]);
    setGlobalFilter("");
    setStatusFilter("ALL");
    setListPage(1);
  }, []);

  const clearTrashFilters = useCallback((): void => {
    setTrashGlobalFilter("");
    setTrashPage(1);
  }, []);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
    (updater) => {
      setColumnFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
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
    setCancelTarget(order);
  };

  const onReopenCancelled = (order: Order): void => {
    setReopenTarget(order);
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

  const confirmPurgeTrashedOrder = (): void => {
    if (!purgeTarget) return;
    const o = purgeTarget;
    toast.promise(
      purgeTrashedOrder.mutateAsync(o.id).then(() => setPurgeTarget(null)),
      {
        loading: `Đang xóa vĩnh viễn ${o.orderNumber}…`,
        success: `Đã xóa vĩnh viễn ${o.orderNumber}`,
        error: (err: unknown) =>
          err instanceof ApiError ? err.message : "Không xóa vĩnh viễn được",
      },
    );
  };

  const trashOrderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Mã đơn",
      enableColumnFilter: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    {
      id: "customer",
      header: "Khách",
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div>
          <div className="text-sm font-medium">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.customerEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      enableColumnFilter: false,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "deletedAt",
      header: "Lưu trữ lúc",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined;
        return (
          <span className="text-xs text-muted-foreground">
            {v ? new Date(v).toLocaleString("vi-VN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      enableColumnFilter: false,
      enableSorting: false,
      meta: { disableColumnFilter: true },
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg"
            onClick={() => setRestoreTarget(row.original)}
            disabled={restoreOrder.isPending || purgeTrashedOrder.isPending}
          >
            <ArchiveRestore className="size-3.5" />
            Khôi phục
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setPurgeTarget(row.original)}
            disabled={restoreOrder.isPending || purgeTrashedOrder.isPending}
          >
            <Trash2 className="size-3.5" />
            Xóa hẳn
          </Button>
        </div>
      ),
    },
  ];

  const trashPaginationFooter = (
    <AdminTablePaginationFooter
      page={trashPage}
      pageSize={trashPageSize}
      total={trashTotal}
      isLoading={trashedLoading}
      onPageChange={setTrashPage}
      onPageSizeChange={setTrashPageSize}
      emptySummary="Không có đơn trong thùng rác"
      itemLabel="đơn"
    />
  );

  const listPaginationFooter = (
    <AdminTablePaginationFooter
      page={listPage}
      pageSize={listPageSize}
      total={totalList}
      isLoading={isLoading}
      onPageChange={setListPage}
      onPageSizeChange={setListPageSize}
      emptySummary="Không có đơn"
      itemLabel="đơn"
    />
  );

  const treeRows = useMemo(() => ordersToTreeRows(orders), [orders]);

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
        disableColumnFilter: true,
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
      accessorKey: "giftNote",
      header: "Quà kèm / Shipper",
      enableColumnFilter: false,
      cell: ({ row, getValue }) => {
        const r = row.original;
        const t = String(getValue() ?? "").trim();
        if (r.rowKind === "order") {
          return (
            <span className="text-muted-foreground text-xs">—</span>
          );
        }
        if (!t) {
          return (
            <span className="text-muted-foreground text-xs">—</span>
          );
        }
        return (
          <span
            className="line-clamp-3 max-w-[260px] text-xs font-medium leading-snug text-amber-950 dark:text-amber-100"
            title={t}
          >
            {t}
          </span>
        );
      },
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
            {canWriteOrders &&
              (order.status === "delivered" ||
                order.status === "cancelled") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => setArchiveTarget(order)}
                  disabled={archiveOrder.isPending}
                >
                  <Archive className="mr-2 size-4" />
                  Lưu trữ
                </Button>
              )}
          </div>
        );
      },
    },
  ];

  const counts = useMemo((): Record<FilterKey, number> => {
    const empty: Record<FilterKey, number> = {
      ALL: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    return { ...empty, ...(statusCounts ?? {}) };
  }, [statusCounts]);

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

      <Tabs
        value={mainTab}
        onValueChange={(v) => {
          if (v === "list" || v === "trash") setMainTab(v);
        }}
        className="space-y-6"
      >
        <TabsList className="h-auto min-h-9 flex-wrap gap-1 rounded-xl p-1">
          <TabsTrigger value="list" className="gap-2 rounded-lg">
            <Layers className="size-4" />
            Đơn hàng
          </TabsTrigger>
          {canWriteOrders ? (
            <TabsTrigger value="trash" className="gap-2 rounded-lg">
              <ArchiveRestore className="size-4" />
              Thùng rác
              {trashedData != null && trashedData.total > 0 ? (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] tabular-nums"
                >
                  {trashedData.total}
                </Badge>
              ) : null}
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="list" className="mt-0 space-y-6">
          <Card className="px-4">
            <p className="text-sm text-on-surface-variant">
              Bảng: cây <span className="font-semibold">đơn → dòng hàng</span>. Chọn trạng
              thái bên dưới để lọc trên server (phân trang ở cuối bảng). Ô tìm nhanh gọi
              API (mã đơn, email, tên khách). «Lưu trữ» chỉ cho đơn đã giao hoặc đã huỷ.
            </p>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trạng thái đơn</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lọc danh sách theo trạng thái (API + phân trang). Số trong ngoặc là tổng
                đơn chưa lưu trữ theo từng trạng thái.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map(({ key, label, hint }) => {
                  const active = statusFilter === key;
                  const n = counts[key];
                  return (
                    <Button
                      key={key}
                      type="button"
                      variant={active ? "default" : "outline"}
                      size="sm"
                      title={hint || undefined}
                      className={cn(
                        "h-auto min-h-9 gap-2 rounded-xl px-3 py-2 font-semibold",
                        active && "shadow-sm",
                      )}
                      onClick={() => applyStatusTab(key)}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "tabular-nums rounded-md px-1.5 py-0.5 text-xs font-bold",
                          active
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {n}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
              manualFiltering
              columnFilters={columnFilters}
              onColumnFiltersChange={handleColumnFiltersChange}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              globalFilterPlaceholder="Tìm nhanh (API): mã đơn, email, tên khách…"
              filterToolbarExtra={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 rounded-lg"
                  onClick={clearListFilters}
                >
                  <FilterX className="size-4" />
                  Xóa bộ lọc
                </Button>
              }
              csvExport={{ fileName: "don-hang.csv" }}
              footer={listPaginationFooter}
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
        </TabsContent>

        {canWriteOrders ? (
          <TabsContent value="trash" className="mt-0 space-y-4">
            {trashedError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 py-12 text-center">
                <p className="text-lg font-bold text-destructive">
                  Không tải được thùng rác
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {trashedError.message}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-on-surface-variant">
                  Đơn lưu trữ không hiển thị cho khách và không xuất hiện trong
                  danh sách chính.
                </p>
                <AdminDataTable<Order>
                  data={trashedOrders}
                  columns={trashOrderColumns}
                  isLoading={trashedLoading}
                  emptyLabel="Thùng rác trống hoặc không khớp tìm kiếm."
                  defaultExpandedAll={false}
                  manualFiltering
                  globalFilter={trashGlobalFilter}
                  onGlobalFilterChange={setTrashGlobalFilter}
                  globalFilterPlaceholder="Tìm theo mã đơn, email, tên khách (API)…"
                  filterToolbarExtra={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5 rounded-lg"
                      onClick={clearTrashFilters}
                    >
                      <FilterX className="size-4" />
                      Xóa bộ lọc
                    </Button>
                  }
                  csvExport={{ fileName: "don-hang-thung-rac.csv" }}
                  footer={trashPaginationFooter}
                />
              </>
            )}
          </TabsContent>
        ) : null}
      </Tabs>

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

      <AlertDialog
        open={cancelTarget != null}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Huỷ đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget ? (
                <>
                  Đơn{" "}
                  <strong className="text-foreground">
                    {cancelTarget.orderNumber}
                  </strong>{" "}
                  sẽ chuyển sang trạng thái đã huỷ và{" "}
                  <strong className="text-foreground">tồn kho được hoàn lại</strong>{" "}
                  theo từng dòng hàng.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Quay lại</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!cancelTarget) return;
                const o = cancelTarget;
                toast.promise(
                  cancelOrder
                    .mutateAsync({ id: o.id, actor: actorLabel })
                    .then(() => setCancelTarget(null)),
                  {
                    loading: `Đang huỷ ${o.orderNumber}...`,
                    success: `${o.orderNumber} đã huỷ – kho đã hoàn`,
                    error: (err: unknown) =>
                      err instanceof ApiError ? err.message : "Lỗi huỷ đơn",
                  },
                );
              }}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Huỷ đơn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reopenTarget != null}
        onOpenChange={(o) => {
          if (!o) setReopenTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Mở lại đơn về &ldquo;Chờ xử lý&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {reopenTarget ? (
                <>
                  Đơn{" "}
                  <strong className="text-foreground">
                    {reopenTarget.orderNumber}
                  </strong>{" "}
                  sẽ quay lại trạng thái chờ xử lý.{" "}
                  <strong className="text-foreground">
                    Tồn kho sẽ bị trừ lại
                  </strong>{" "}
                  theo từng dòng hàng như lúc đặt.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                if (!reopenTarget) return;
                const o = reopenTarget;
                toast.promise(
                  reopenCancelled
                    .mutateAsync({ id: o.id, actor: actorLabel })
                    .then(() => setReopenTarget(null)),
                  {
                    loading: `Đang mở lại ${o.orderNumber}...`,
                    success: `${o.orderNumber} → Chờ xử lý (đã trừ tồn lại)`,
                    error: (err: unknown) =>
                      err instanceof ApiError
                        ? err.message
                        : "Không mở lại được đơn",
                  },
                );
              }}
              disabled={reopenCancelled.isPending}
            >
              {reopenCancelled.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Mở lại đơn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={archiveTarget != null}
        onOpenChange={(o) => {
          if (!o) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Lưu trữ đơn (xóa tạm)?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget ? (
                <>
                  Đơn{" "}
                  <strong className="text-foreground">
                    {archiveTarget.orderNumber}
                  </strong>{" "}
                  sẽ ẩn khỏi danh sách và storefront. Chỉ đơn đã giao hoặc đã
                  huỷ mới lưu trữ được.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (!archiveTarget) return;
                const o = archiveTarget;
                toast.promise(
                  archiveOrder.mutateAsync(o.id).then(() => setArchiveTarget(null)),
                  {
                    loading: `Đang lưu trữ ${o.orderNumber}…`,
                    success: `Đã lưu trữ ${o.orderNumber}`,
                    error: (err: unknown) =>
                      err instanceof ApiError
                        ? err.message
                        : "Không lưu trữ được",
                  },
                );
              }}
              disabled={archiveOrder.isPending}
            >
              {archiveOrder.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Lưu trữ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={purgeTarget != null}
        onOpenChange={(o) => {
          if (!o) setPurgeTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              {purgeTarget ? (
                <>
                  Đơn{" "}
                  <strong className="text-foreground">
                    {purgeTarget.orderNumber}
                  </strong>{" "}
                  sẽ bị xoá khỏi cơ sở dữ liệu. Không thể hoàn tác.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmPurgeTrashedOrder();
              }}
              disabled={purgeTrashedOrder.isPending}
            >
              {purgeTrashedOrder.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xóa vĩnh viễn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={restoreTarget != null}
        onOpenChange={(o) => {
          if (!o) setRestoreTarget(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl sm:max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục đơn?</AlertDialogTitle>
            <AlertDialogDescription>
              {restoreTarget ? (
                <>
                  Đưa{" "}
                  <strong className="text-foreground">
                    {restoreTarget.orderNumber}
                  </strong>{" "}
                  trở lại danh sách đơn hàng.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={(e) => {
                e.preventDefault();
                if (!restoreTarget) return;
                const o = restoreTarget;
                toast.promise(
                  restoreOrder.mutateAsync(o.id).then(() => setRestoreTarget(null)),
                  {
                    loading: `Đang khôi phục ${o.orderNumber}…`,
                    success: `Đã khôi phục ${o.orderNumber}`,
                    error: (err: unknown) =>
                      err instanceof ApiError
                        ? err.message
                        : "Không khôi phục được",
                  },
                );
              }}
              disabled={restoreOrder.isPending}
            >
              {restoreOrder.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Khôi phục"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
