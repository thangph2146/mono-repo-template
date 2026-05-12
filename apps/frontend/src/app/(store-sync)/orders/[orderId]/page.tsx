"use client";

import { useEffect } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_DEFAULT,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock3,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import type { Order } from "@/lib/api";
import { useOrder } from "@/hooks/queries";
import { formatDate, formatVND } from "@/lib/format";
import { useSession } from "@/hooks/use-session";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const session = useSession();
  const orderId = Number(params.orderId);
  const isValid = Number.isFinite(orderId) && orderId > 0;
  const { data, isLoading: loading, error } = useOrder(
    isValid && session ? orderId : null,
  );

  useEffect(() => {
    if (!session) {
      router.replace(
        `/login?next=${encodeURIComponent(`/orders/${params.orderId}`)}`,
      );
    }
  }, [session, router, params.orderId]);

  if (!session) {
    return (
      <Page>
        <PageContent className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Đang chuyển tới đăng nhập…</p>
        </PageContent>
      </Page>
    );
  }

  if (!isValid) {
    notFound();
  }

  if (!loading && !data && !error) {
    notFound();
  }

  if (data && data.customerEmail !== session.username) {
    notFound();
  }

  return (
    <Page>
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
        <section>
          <Container max={STORE_CONTAINER_MAX_DEFAULT} className={`${STORE_CONTAINER_INSET} space-y-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href="/orders">
                <Button variant="outline" className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại danh sách đơn
                </Button>
              </Link>
              {data && <StatusBadge status={data.status} />}
            </div>

            {error && (
              <div className="text-center py-12 bg-destructive/5 border border-destructive/20 rounded-2xl">
                <p className="text-lg font-bold text-destructive">Không tải được đơn hàng</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            )}

            {loading && <div className="h-72 rounded-2xl bg-muted/30 animate-pulse" />}

            {data && <OrderCard order={data} />}
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  if (status === "delivered") {
    return (
      <Badge className="bg-success/10 text-success border-success/20">Đã giao</Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20">Đã hủy</Badge>
    );
  }
  return (
    <Badge className="bg-primary/10 text-primary border-primary/20">Đang xử lý</Badge>
  );
}

function OrderCard({ order }: { order: Order }) {
  const isShipping =
    order.status === "shipped" || order.status === "confirmed";
  const isDone = order.status === "delivered";

  return (
    <Card className="rounded-2xl border-outline-variant">
      <CardHeader className="border-b border-outline-variant/40">
        <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
          Chi tiết đơn {order.orderNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface/40 p-4">
          <p className="text-sm text-muted-foreground mb-3 font-semibold">Tiến trình đơn hàng</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TimelineStep label="Đã đặt đơn" active />
            <TimelineStep label="Đang vận chuyển" active={isShipping || isDone} />
            <TimelineStep label="Hoàn tất" active={isDone} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoTile icon={Clock3} label="Thời gian đặt" value={formatDate(order.createdAt)} />
          <InfoTile icon={Truck} label="Trạng thái" value={order.status} />
          <InfoTile icon={Package} label="Tổng thanh toán" value={formatVND(order.totalAmount)} />
        </div>

        {order.assignedShipper && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <span className="text-muted-foreground font-semibold">Shipper phụ trách: </span>
            <span className="font-bold text-foreground">{order.assignedShipper.fullName}</span>
            <span className="text-muted-foreground"> · {order.assignedShipper.email}</span>
          </div>
        )}

        {order.shippingAddress && (
          <div className="bg-muted/30 border border-outline-variant/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Địa chỉ nhận hàng</p>
            <p className="text-lg font-bold">{order.shippingAddress}</p>
          </div>
        )}

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={`${order.id}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-outline-variant/30 p-4 hover:bg-muted/20 transition-colors"
            >
              <div>
                <Link
                  href={`/catalog/${item.productId}`}
                  className="font-bold hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  SKU: {item.sku} · SL: {item.quantity}{" "}
                  {item.unitLabel?.trim()
                    ? `${item.unitLabel} (${item.unitType})`
                    : item.unitType}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Đơn giá lúc đặt:{" "}
                  {item.listUnitPrice != null &&
                  Number(item.listUnitPrice) > Number(item.unitPrice) ? (
                    <>
                      <span className="line-through opacity-80">
                        {formatVND(Number(item.listUnitPrice))}
                      </span>{" "}
                      <span className="font-semibold text-foreground">
                        {formatVND(Number(item.unitPrice))}
                      </span>
                      {" / "}
                      {item.unitLabel ?? item.unitType}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        {formatVND(Number(item.unitPrice))}
                      </span>
                      {" / "}
                      {item.unitLabel ?? item.unitType}
                    </>
                  )}
                </p>
              </div>
              <p className="font-black text-primary">{formatVND(item.totalPrice)}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link href="/catalog">
            <Button className="rounded-xl h-12 font-bold">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mua lại từ danh mục
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="outline" className="rounded-xl h-12 font-bold">
              Liên hệ hỗ trợ đơn hàng
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 flex items-center gap-2 ${
        active
          ? "border-primary/40 bg-primary/5 text-primary"
          : "border-outline-variant/40 text-muted-foreground"
      }`}
    >
      <CircleDot className="w-4 h-4" />
      <span className="font-semibold text-sm">{label}</span>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface p-4">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </p>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}
