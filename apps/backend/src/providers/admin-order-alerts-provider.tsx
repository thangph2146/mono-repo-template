"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOrderStatusCounts, usePendingOrdersPreview, type OrderStatusTabKey } from "@/hooks/queries";
import type { Order } from "@/lib/api";

export type AdminOrderAlert = {
  id: string;
  createdAt: number;
  message: string;
  pendingTotal: number;
};

type OrderAlertsContextValue = {
  pendingCount: number;
  statusCounts: Record<OrderStatusTabKey, number> | undefined;
  notifications: AdminOrderAlert[];
  clearNotifications: () => void;
  pendingPreview: Order[];
  pendingPreviewLoading: boolean;
};

const OrderAlertsContext = createContext<OrderAlertsContextValue | null>(null);

export function useOrderAlerts(): OrderAlertsContextValue {
  const ctx = useContext(OrderAlertsContext);
  if (!ctx) {
    return {
      pendingCount: 0,
      statusCounts: undefined,
      notifications: [],
      clearNotifications: () => { },
      pendingPreview: [],
      pendingPreviewLoading: false,
    };
  }
  return ctx;
}

/**
 * Polling đếm đơn (~5s) + toast khi số đơn `pending` tăng (cửa hàng đặt hàng).
 * WebSocket/SSE có thể bổ sung sau; hiện tại gần realtime và nhẹ nhờ một endpoint API.
 */
export function AdminOrderAlertsProvider({
  alertsEnabled,
  children,
}: {
  alertsEnabled: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { data } = useOrderStatusCounts({
    enabled: alertsEnabled,
    liveRefresh: alertsEnabled,
  });
  const { data: pendingPreview = [], isLoading: pendingPreviewLoading } =
    usePendingOrdersPreview({
      enabled: alertsEnabled,
      liveRefresh: alertsEnabled,
    });
  const prevPendingRef = useRef<number | null>(null);
  const [notifications, setNotifications] = useState<AdminOrderAlert[]>([]);

  useEffect(() => {
    if (!data) return;
    const pending = data.pending;
    const prev = prevPendingRef.current;
    if (prev !== null && pending > prev) {
      const delta = pending - prev;
      const message =
        delta === 1
          ? "Có 1 đơn hàng mới đang chờ xử lý từ cửa hàng."
          : `Có ${delta} đơn hàng mới đang chờ xử lý từ cửa hàng.`;
      toast.info(message, {
        duration: 10_000,
        action: {
          label: "Xem đơn",
          onClick: () => {
            router.push("/orders");
          },
        },
      });
      setNotifications((n) =>
        [
          {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            message,
            pendingTotal: pending,
          },
          ...n,
        ].slice(0, 25),
      );
    }
    prevPendingRef.current = pending;
  }, [data, router]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<OrderAlertsContextValue>(
    () => ({
      pendingCount: data?.pending ?? 0,
      statusCounts: data,
      notifications,
      clearNotifications,
      pendingPreview,
      pendingPreviewLoading,
    }),
    [
      data,
      notifications,
      clearNotifications,
      pendingPreview,
      pendingPreviewLoading,
    ],
  );

  return (
    <OrderAlertsContext.Provider value={value}>
      {children}
    </OrderAlertsContext.Provider>
  );
}
