"use client";

import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui/components/popover";
import { useOrderAlerts } from "@/providers/admin-order-alerts-provider";
import { formatDate, formatVND } from "@/lib/format";
import type { OrderStatus } from "@/lib/api";

const ORDER_STATUS_VI: Record<OrderStatus, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã chốt kho",
  shipped: "Đang giao",
  delivered: "Đã giao & thu tiền",
  cancelled: "Đã huỷ",
};

export function AdminNotificationBell() {
  const {
    pendingCount,
    notifications,
    clearNotifications,
    pendingPreview,
    pendingPreviewLoading,
  } = useOrderAlerts();
  const hasFeed = notifications.length > 0;
  const morePending = pendingCount > pendingPreview.length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative h-10 w-10 rounded-xl border-border/70 bg-background/90 text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow active:scale-[0.98] [&_svg]:size-5"
            aria-label={
              pendingCount > 0
                ? `Thông báo đơn hàng, ${pendingCount} đơn chờ xử lý`
                : "Thông báo đơn hàng"
            }
            title="Quản lý đơn hàng & thông báo đơn mới"
          />
        }
      >
        <Bell aria-hidden className="size-5" />
        {pendingCount > 0 ? (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground ring-2 ring-background">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[min(calc(100vw-1.5rem),22rem)] p-0"
      >
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Quản lý đơn hàng</p>
          <p className="text-caption text-muted-foreground">
            Thông báo đơn mới cập nhật vài giây; danh sách dưới là đơn đang chờ xử
            lý.
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {hasFeed ? (
            <ul className="space-y-1 border-b border-border p-2">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-sm"
                >
                  <p className="text-foreground">{n.message}</p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {formatDate(new Date(n.createdAt))} · Tổng chờ:{" "}
                    {n.pendingTotal}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="p-2">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-caption font-medium text-muted-foreground">
                Đơn chờ xử lý
                {pendingCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 align-middle text-[0.65rem] tabular-nums"
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </Badge>
                ) : null}
              </p>
              <Link
                href="/orders"
                className="text-caption font-medium text-primary underline-offset-2 hover:underline"
              >
                Mở trang đơn hàng
              </Link>
            </div>

            {pendingPreviewLoading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-label="Đang tải" />
              </div>
            ) : pendingPreview.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 px-3 py-6 text-center text-sm text-muted-foreground">
                Không có đơn chờ xử lý.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/70">
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto_minmax(4.5rem,auto)] gap-x-2 border-b border-border/70 bg-muted/40 px-2.5 py-1.5 text-[0.65rem] font-semibold text-muted-foreground"
                >
                  <span>Mã đơn</span>
                  <span className="text-right">Tiền</span>
                  <span className="truncate text-right" title="Trạng thái">
                    Trạng thái
                  </span>
                </div>
                <ul className="divide-y divide-border/60">
                  {pendingPreview.map((o) => (
                    <li key={o.id}>
                      <Link
                        href="/orders"
                        className="grid grid-cols-[minmax(0,1fr)_auto_minmax(4.5rem,auto)] gap-x-2 items-center px-2.5 py-2 text-sm transition-colors hover:bg-muted/60"
                        title={`${o.orderNumber} · ${formatVND(o.totalAmount)} · ${ORDER_STATUS_VI[o.status]}`}
                      >
                        <span className="truncate font-mono text-xs font-medium text-foreground">
                          {o.orderNumber}
                        </span>
                        <span className="whitespace-nowrap text-right text-xs tabular-nums text-foreground">
                          {formatVND(o.totalAmount)}
                        </span>
                        <span
                          className="truncate text-right text-[0.7rem] leading-tight text-muted-foreground"
                          title={ORDER_STATUS_VI[o.status]}
                        >
                          {ORDER_STATUS_VI[o.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {morePending ? (
                  <p className="border-t border-border/70 bg-muted/20 px-2.5 py-2 text-center text-[0.7rem] leading-snug text-muted-foreground">
                    Còn{" "}
                    <span className="font-medium text-foreground">
                      {pendingCount - pendingPreview.length}
                    </span>{" "}
                    đơn khác — xem đủ tại trang Quản lý đơn hàng.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-2">
          {hasFeed ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearNotifications}
            >
              Xóa danh sách
            </Button>
          ) : (
            <span />
          )}
          <Link
            href="/orders"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Quản lý đơn hàng
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
