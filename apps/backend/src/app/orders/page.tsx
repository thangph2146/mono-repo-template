"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
  Search, CalendarDays, Filter, CheckCircle2, Truck, Clock,
  AlertCircle, ChevronDown, ChevronUp, Box, Package2,
  Store, Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import products from "@ui/data/products.json";

type OrderStatus = "PENDING" | "SHIPPING" | "PAID_AND_DELIVERED";

type OrderItem = {
  productId: string;
  qty: number;
  unitType: string;
  unitLabel: string;
  purchaseType: "si" | "le";
  price: string;
};

type Order = {
  id: string;
  store: string;
  address: string;
  date: string;
  total: string;
  status: OrderStatus;
  items: OrderItem[];
};

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-0899",
    store: "Tạp hóa Số 1",
    address: "Tạp hóa Số 1, Quận 1, TP.HCM",
    date: "05/05/2026 14:30",
    total: "1.975.000đ",
    status: "PENDING",
    items: [
      { productId: "PROD-001", qty: 5,  unitType: "thùng", unitLabel: "Thùng (24 lon)",  purchaseType: "si", price: "925.000đ" },
      { productId: "PROD-002", qty: 10, unitType: "thùng", unitLabel: "Thùng (30 gói)", purchaseType: "si", price: "1.050.000đ" },
    ],
  },
  {
    id: "ORD-0898",
    store: "Minimart Hoa Mai",
    address: "128 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
    date: "05/05/2026 10:15",
    total: "4.500.000đ",
    status: "SHIPPING",
    items: [
      { productId: "PROD-003", qty: 12, unitType: "lốc",   unitLabel: "Lốc (4 hộp)",    purchaseType: "si", price: "3.420.000đ" },
      { productId: "PROD-004", qty: 2,  unitType: "can",   unitLabel: "Can (5 lít)",      purchaseType: "si", price: "1.080.000đ" },
    ],
  },
  {
    id: "ORD-0897",
    store: "Đại lý Cấp 2 - Bình Tân",
    address: "Đại lý Cấp 2 - Bình Tân, TP.HCM",
    date: "04/05/2026 16:45",
    total: "12.000.000đ",
    status: "PAID_AND_DELIVERED",
    items: [
      { productId: "PROD-001", qty: 20, unitType: "thùng", unitLabel: "Thùng (24 lon)",  purchaseType: "si", price: "3.700.000đ" },
      { productId: "PROD-002", qty: 40, unitType: "thùng", unitLabel: "Thùng (30 gói)", purchaseType: "si", price: "4.400.000đ" },
      { productId: "PROD-004", qty: 7,  unitType: "thùng", unitLabel: "Thùng (12 chai)", purchaseType: "si", price: "3.900.000đ" },
    ],
  },
];

const STATUS_FILTERS = [
  { key: "ALL",                label: "Tất cả" },
  { key: "PENDING",            label: "Chờ xử lý" },
  { key: "SHIPPING",           label: "Đang giao" },
  { key: "PAID_AND_DELIVERED", label: "Đã hoàn tất" },
] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["ORD-0899"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = (orderId: string) => {
    toast.promise(
      new Promise<void>((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `Đang xử lý thanh toán & trừ kho cho ${orderId}...`,
        success: () => {
          setOrders((prev) =>
            prev.map((o) => o.id === orderId ? { ...o, status: "PAID_AND_DELIVERED" } : o)
          );
          return `${orderId} đã xác nhận. Kho trừ tự động!`;
        },
        error: "Lỗi kết nối cơ sở dữ liệu",
      }
    );
  };

  const handleShipping = (orderId: string) => {
    toast.promise(
      new Promise<void>((resolve) => setTimeout(resolve, 800)),
      {
        loading: `Đang cập nhật trạng thái giao hàng ${orderId}...`,
        success: () => {
          setOrders((prev) =>
            prev.map((o) => o.id === orderId ? { ...o, status: "SHIPPING" } : o)
          );
          return `${orderId} đã chuyển sang Đang giao!`;
        },
        error: "Lỗi cập nhật trạng thái",
      }
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-warning/15 text-warning border-warning/20 px-3 py-1 font-bold"><Clock className="w-3.5 h-3.5 mr-1.5" />Chờ xử lý</Badge>;
      case "SHIPPING":
        return <Badge className="bg-primary/15 text-primary border-primary/20 px-3 py-1 font-bold"><Truck className="w-3.5 h-3.5 mr-1.5" />Đang giao</Badge>;
      case "PAID_AND_DELIVERED":
        return <Badge className="bg-success/15 text-success border-success/20 px-3 py-1 font-bold"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Đã giao &amp; Thu tiền</Badge>;
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.store.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    SHIPPING: orders.filter((o) => o.status === "SHIPPING").length,
    PAID_AND_DELIVERED: orders.filter((o) => o.status === "PAID_AND_DELIVERED").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-lg text-on-surface-variant font-medium mt-1">Xác nhận giao hàng, thu tiền COD và trừ kho theo từng mặt hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <p className={`text-3xl font-black ${statusFilter === f.key ? "text-primary-foreground" : "text-foreground"}`}>
              {counts[f.key]}
            </p>
            <p className={`text-sm font-semibold mt-1 ${statusFilter === f.key ? "text-primary-foreground/80" : "text-on-surface-variant"}`}>
              {f.label}
            </p>
          </Button>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-5 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-[500px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
          <Input
            placeholder="Tìm mã đơn, tên đại lý / cửa hàng..."
            className="pl-12 py-6 text-base bg-background border-outline-variant rounded-xl focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button variant="outline" className="flex items-center gap-2 bg-background border-outline-variant font-bold px-6 h-12 rounded-xl hover:bg-muted">
            <CalendarDays className="w-5 h-5" /> Hôm nay
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-background border-outline-variant font-bold px-6 h-12 rounded-xl hover:bg-muted">
            <Filter className="w-5 h-5" /> Lọc nâng cao
          </Button>
        </div>
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filtered.map((order) => {
          const expanded = expandedIds.has(order.id);
          return (
            <div key={order.id} className="bg-background rounded-2xl border border-outline-variant shadow-sm overflow-hidden">

              {/* Row header */}
              <div
                className={`flex flex-wrap items-center gap-3 px-6 py-4 cursor-pointer select-none transition-colors ${
                  order.status === "PENDING" ? "bg-warning/5 hover:bg-warning/10"
                  : order.status === "SHIPPING" ? "bg-primary/5 hover:bg-primary/10"
                  : "bg-success/5 hover:bg-success/10"
                }`}
                onClick={() => toggleExpand(order.id)}
              >
                {/* Order ID + store */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <span className="font-black text-lg text-primary shrink-0">{order.id}</span>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium text-sm min-w-0">
                    <Store className="w-4 h-4 shrink-0" />
                    <span className="truncate">{order.store}</span>
                  </div>
                </div>

                {/* Right: date, total, status, expand */}
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className="text-sm text-on-surface-variant font-medium">{order.date}</span>
                  <span className="font-black text-lg text-foreground">{order.total}</span>
                  {getStatusBadge(order.status)}
                  {expanded
                    ? <ChevronUp className="w-5 h-5 text-outline shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-outline shrink-0" />}
                </div>
              </div>

              {/* Expanded: item details */}
              {expanded && (
                <div className="px-6 py-5 space-y-4 border-t border-outline-variant/30">

                  {/* Address */}
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-muted/30 rounded-xl px-4 py-2.5">
                    <Package2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{order.address}</span>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Chi tiết hàng hóa ({order.items.length} mặt hàng)</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => {
                        const product = products.find((p) => p.id === item.productId);
                        return (
                          <div key={idx} className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface/60 px-4 py-3">
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-lg border border-outline-variant/40 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                              {product?.primaryImage
                                ? <img src={product.primaryImage} alt="" className="w-full h-full object-contain p-1" />
                                : <Box className="w-6 h-6 text-outline-variant" />}
                            </div>

                            {/* Product info */}
                            <div className="flex-grow min-w-0">
                              <p className="font-bold text-sm text-foreground line-clamp-1">{product?.name ?? item.productId}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <Badge className="text-[10px] px-1.5 py-0 bg-muted text-on-surface-variant border-outline-variant/40 font-semibold">
                                  {product?.category ?? "—"}
                                </Badge>
                                <span className="text-xs text-on-surface-variant font-medium">{item.unitLabel}</span>
                                {item.purchaseType === "si"
                                  ? <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-bold">Sỉ</Badge>
                                  : <Badge className="text-[10px] px-1.5 py-0 bg-secondary/10 text-secondary border-secondary/20 font-bold">Lẻ</Badge>}
                              </div>
                            </div>

                            {/* Qty + price */}
                            <div className="text-right shrink-0">
                              <p className="font-black text-primary text-base">{item.price}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5">× {item.qty} {item.unitType}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 justify-end pt-2 border-t border-outline-variant/20">
                    {order.status === "PENDING" && (
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 shadow"
                        onClick={() => handleShipping(order.id)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Bắt đầu Giao hàng
                      </Button>
                    )}
                    {order.status === "SHIPPING" && (
                      <Button
                        className="bg-success hover:bg-success/90 text-white font-bold rounded-xl px-6 shadow"
                        onClick={() => handleConfirm(order.id)}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Xác nhận Đã Giao & Thu tiền
                      </Button>
                    )}
                    {order.status === "PAID_AND_DELIVERED" && (
                      <div className="flex items-center gap-2 text-success font-bold text-sm bg-success/5 py-2 px-4 rounded-xl border border-success/20">
                        <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất – Kho đã trừ
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-outline-variant">
          <Package2 className="w-16 h-16 mx-auto text-outline-variant opacity-20 mb-4" />
          <p className="text-xl font-bold text-on-surface-variant">Không có đơn hàng phù hợp</p>
        </div>
      )}

      {/* Info note */}
      <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">Lưu ý quan trọng:</p>
          <p className="text-on-surface-variant leading-relaxed text-sm">
            Tồn kho chỉ được trừ sau khi nhấn <span className="font-bold text-primary">&ldquo;Xác nhận Đã Giao &amp; Thu tiền&rdquo;</span>.
            Quy trình: <span className="font-semibold">Chờ xử lý → Đang giao → Đã giao & Thu tiền</span>. Mỗi bước trừ kho theo đúng đơn vị (thùng / can / chai / lốc / gói).
          </p>
        </div>
      </div>
    </div>
  );
}
