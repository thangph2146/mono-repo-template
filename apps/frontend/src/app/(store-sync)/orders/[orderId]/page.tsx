"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, CircleDot, Clock3, Package, Truck } from "lucide-react";
import orders from "@/data/order-tracking.json";
import products from "@/data/products.json";
import { Container, Page, PageContent } from "@/components/shared/layout";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const order = orders.find((item) => item.id === params.orderId);

  if (!order) {
    notFound();
  }

  const isShipping = order.status === "Đang giao hàng";

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/orders">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách đơn
          </Button>
        </Link>
        <Badge className={isShipping ? "bg-primary/10 text-primary border-primary/20" : "bg-success/10 text-success border-success/20"}>
          {order.status}
        </Badge>
      </div>

      <Card className="rounded-2xl border-outline-variant">
        <CardHeader className="border-b border-outline-variant/40">
          <CardTitle className="text-3xl font-black tracking-tight">Chi tiết đơn {order.id}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="rounded-2xl border border-outline-variant/40 bg-surface/40 p-4">
            <p className="text-sm text-muted-foreground mb-3 font-semibold">Tiến trình đơn hàng</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TimelineStep label="Đã đặt đơn" active />
              <TimelineStep label="Đang vận chuyển" active={isShipping} />
              <TimelineStep label="Hoàn tất" active={!isShipping} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoTile icon={Clock3} label="Thời gian đặt" value={order.date} />
            <InfoTile icon={Truck} label="Trạng thái giao hàng" value={order.eta} />
            <InfoTile icon={Package} label="Tổng thanh toán" value={order.total} />
          </div>

          <div className="bg-muted/30 border border-outline-variant/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Địa chỉ nhận hàng</p>
            <p className="text-lg font-bold">{order.address}</p>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-xl border border-outline-variant/30 p-4 hover:bg-muted/20 transition-colors">
                <div>
                  <Link href={`/catalog/${item.productId}`} className="font-bold hover:text-primary transition-colors">
                    {products.find((p) => p.id === item.productId)?.name ?? item.productId}
                  </Link>
                  <p className="text-sm text-muted-foreground">Số lượng: {item.qty}</p>
                </div>
                <p className="font-black text-primary">{item.price}</p>
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
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

function TimelineStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-2 ${active ? "border-primary/40 bg-primary/5 text-primary" : "border-outline-variant/40 text-muted-foreground"}`}>
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
