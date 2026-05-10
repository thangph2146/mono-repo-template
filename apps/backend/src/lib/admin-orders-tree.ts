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
      orderId: o.id,
      item: it,
    })),
  }));
}

function formatUnitPrice(it: OrderItem): string {
  return `${it.unitPrice.toLocaleString("vi-VN")} đ / ĐG`;
}
