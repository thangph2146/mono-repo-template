import type { Order, OrderItem, OrderStatus } from "@/lib/api";

export type OrderTreeRow =
  | {
      rowKind: "order";
      id: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      totalAmount: number;
      status: OrderStatus;
      filterStatus: OrderStatus;
      createdAt: string;
      paymentLabel: string;
      shipNote: string;
      /** Luôn rỗng ở dòng đơn — dùng chung cột với dòng mặt hàng. */
      giftNote: string;
      order: Order;
      subRows?: OrderTreeRow[];
    }
  | {
      rowKind: "line";
      id: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      productLine: string;
      qtyLine: string;
      totalAmount: number;
      status: OrderStatus | "";
      filterStatus: OrderStatus;
      createdAt: string;
      paymentLabel: string;
      shipNote: string;
      giftNote: string;
      orderId: number;
      item: OrderItem;
    };

export function getOrderSubRows(
  row: OrderTreeRow,
): OrderTreeRow[] | undefined {
  if (row.rowKind !== "order") return undefined;
  return row.subRows;
}

export function ordersToTreeRows(orders: Order[]): OrderTreeRow[] {
  return orders.map((o) => ({
    rowKind: "order",
    id: `ord-${o.id}`,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerPhone: o.customerPhone ?? "",
    totalAmount: o.totalAmount,
    status: o.status,
    filterStatus: o.status,
    createdAt: o.createdAt,
    paymentLabel: `${o.paymentMethod} · ${o.paymentStatus === "paid" ? "Đã thu" : "Chưa thu"}`,
    shipNote: o.shippingAddress ?? "",
    giftNote: "",
    order: o,
    subRows: o.items.map((it, i) => ({
      rowKind: "line",
      id: `ord-${o.id}-l-${i}`,
      orderNumber: it.sku,
      customerName: it.name,
      customerPhone: "",
      productLine: it.name,
      qtyLine: `${it.quantity} × ${it.unitType}`,
      totalAmount: it.totalPrice,
      status: "",
      filterStatus: o.status,
      createdAt: "",
      paymentLabel: formatUnitPrice(it),
      shipNote: "",
      giftNote: (it.giftNote ?? "").trim(),
      orderId: o.id,
      item: it,
    })),
  }));
}

function formatUnitPrice(it: OrderItem): string {
  const u = Number(it.unitPrice);
  const list =
    it.listUnitPrice != null && Number.isFinite(Number(it.listUnitPrice))
      ? Number(it.listUnitPrice)
      : null;
  const base = `${u.toLocaleString("vi-VN")} đ / ĐG (lúc đặt)`;
  if (list != null && list > u) {
    return `${list.toLocaleString("vi-VN")} đ → ${base}`;
  }
  return base;
}
