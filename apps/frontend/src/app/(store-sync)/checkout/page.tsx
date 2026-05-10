"use client";

import type { FormEvent } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  ArrowLeft,
  Banknote,
  HelpCircle,
  Loader2,
  Package2,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { useCreateOrder, useUserById } from "@/hooks/queries";
import { ApiError } from "@/lib/api";
import { formatVND } from "@/lib/format";
import { CartLineItem } from "@/components/shared/cart-line-item";
import { CheckoutPromoField } from "@/components/shared/cart-order-summary";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const session = useSession();
  const sessionUserId = session?.id ? Number.parseInt(session.id, 10) : NaN;
  const userId = Number.isFinite(sessionUserId) ? sessionUserId : undefined;
  const { data: profile } = useUserById(userId);
  const createOrder = useCreateOrder();

  const isEmpty = cart.lines.length === 0;

  useEffect(() => {
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
    }
  }, [session, router]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isEmpty) return;
    if (!session) {
      router.push(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }
    const fd = new FormData(event.currentTarget);
    const customerName = String(fd.get("customerName") ?? "").trim();
    const customerPhone = String(fd.get("customerPhone") ?? "").trim();
    const shippingAddress = String(fd.get("shippingAddress") ?? "").trim();
    const notes = String(fd.get("notes") ?? "").trim();

    if (!customerName || !shippingAddress) {
      toast.error("Vui lòng nhập tên người nhận và địa chỉ giao hàng");
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        customerId: profile?.id ?? null,
        customerName,
        customerEmail: session.username,
        customerPhone: customerPhone || undefined,
        shippingAddress,
        notes: notes || undefined,
        paymentMethod: "cod",
        items: cart.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitType: l.unitType,
        })),
        couponCode: cart.couponCodeForOrder,
      });
      cart.clear();
      toast.success(`Đặt hàng thành công – ${order.orderNumber}`, {
        description: "Đơn được giao tận nơi và thu tiền khi nhận hàng (COD).",
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Không thể đặt hàng";
      toast.error(message);
    }
  };

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-8">
            <div className="flex items-center gap-6">
              <Link href="/catalog">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl bg-background hover:bg-muted shadow-sm border-outline-variant transition-transform hover:scale-105"
                >
                  <ArrowLeft className="w-7 h-7 text-primary" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  Giỏ hàng &amp; Đặt đơn COD
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Kiểm tra lại sản phẩm và xác nhận thông tin giao nhận
                </p>
              </div>
            </div>

            <form
              key={profile?.id ?? "guest"}
              onSubmit={(e) => void handleSubmit(e)}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-outline-variant shadow-sm overflow-hidden bg-background rounded-3xl">
                  <CardHeader className="bg-surface border-b border-outline-variant pb-5">
                    <CardTitle className="text-2xl flex items-center justify-between">
                      <span className="font-bold">
                        Danh sách sản phẩm ({cart.lines.length})
                      </span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1">
                        Tổng: {cart.unitCount} đơn vị
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isEmpty ? (
                      <div className="text-center py-20 space-y-4">
                        <Package2 className="w-20 h-20 mx-auto text-outline-variant opacity-30" />
                        <p className="text-2xl font-bold text-on-surface-variant">
                          Giỏ hàng trống
                        </p>
                        <p className="text-muted-foreground">
                          Chọn sản phẩm từ danh mục để bắt đầu đặt đơn.
                        </p>
                        <Link href="/catalog">
                          <Button className="rounded-xl font-bold mt-2">
                            <ShoppingCart className="w-4 h-4 mr-2" /> Xem danh mục
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant/30">
                        {cart.lines.map((line) => (
                          <CartLineItem
                            key={`${line.productId}:${line.unitType}`}
                            line={line}
                            onQuantityChange={(next) =>
                              cart.setQuantity(
                                line.productId,
                                line.unitType,
                                next,
                              )
                            }
                            onRemove={() =>
                              cart.remove(line.productId, line.unitType)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-outline-variant shadow-sm bg-background rounded-3xl overflow-hidden">
                  <CardHeader className="bg-surface border-b border-outline-variant pb-5">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Truck className="w-6 h-6 text-primary" />
                      Thông tin giao hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cust-name">Tên người nhận</Label>
                        <Input
                          id="cust-name"
                          name="customerName"
                          placeholder="Nguyễn Văn A"
                          defaultValue={profile?.fullName ?? ""}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cust-phone">Số điện thoại</Label>
                        <Input
                          id="cust-phone"
                          name="customerPhone"
                          placeholder="09xxxxxxxx"
                          defaultValue={profile?.phone ?? ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cust-address">Địa chỉ giao hàng</Label>
                      <Textarea
                        id="cust-address"
                        name="shippingAddress"
                        rows={2}
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                        defaultValue={profile?.address ?? ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Ghi chú cho shipper</Label>
                      <Input
                        id="notes"
                        name="notes"
                        placeholder="VD: Giao trong giờ hành chính"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="py-0 border-primary shadow-xl sticky top-24 bg-background rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-primary text-primary-foreground p-8 text-center">
                    <CardTitle className="text-3xl font-extrabold">
                      Tổng thanh toán
                    </CardTitle>
                    <p className="text-primary-fixed-dim/90 font-medium mt-1">
                      Thu tiền khi giao hàng (COD)
                    </p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <CheckoutPromoField />

                    <div className="flex justify-between text-lg">
                      <span className="text-on-surface-variant font-medium">
                        Tạm tính ({cart.unitCount} đơn vị)
                      </span>
                      <span className="font-bold text-foreground">
                        {formatVND(cart.subtotal)}
                      </span>
                    </div>

                    {cart.wholesaleSavings > 0 && (
                      <p className="rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs leading-relaxed text-success">
                        <strong>Tiết kiệm giá sỉ</strong> (so với giá lẻ cùng quy cách, đã
                        gộp trong tạm tính):{" "}
                        <span className="font-black tabular-nums">
                          {formatVND(cart.wholesaleSavings)}
                        </span>
                      </p>
                    )}

                    {cart.promoDiscount > 0 && (
                      <div className="flex justify-between text-lg text-primary">
                        <span className="font-medium">Giảm mã khuyến mãi</span>
                        <span className="font-bold tabular-nums">
                          −{formatVND(cart.promoDiscount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-lg items-center">
                      <span className="text-on-surface-variant flex items-center gap-2 font-medium">
                        <Truck className="w-5 h-5 text-primary" /> Phí vận chuyển
                      </span>
                      <span className="font-bold text-success uppercase tracking-wider text-sm">
                        Miễn phí
                      </span>
                    </div>

                    <div className="border-t border-outline-variant/40 border-dashed pt-6 mt-2 space-y-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-bold text-on-surface-variant">
                          Thành tiền
                        </span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-4xl font-black text-primary tracking-tighter">
                            {formatVND(cart.grandTotal)}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl"
                        disabled={isEmpty || createOrder.isPending}
                      >
                        {createOrder.isPending
                          ? "Đang đặt hàng..."
                          : isEmpty
                            ? "Giỏ hàng trống"
                            : "ĐẶT HÀNG NGAY"}
                      </Button>

                      <div className="p-4 bg-muted/30 rounded-2xl border border-outline-variant/30">
                        <div className="flex items-center gap-3 text-foreground font-bold">
                          <Banknote className="w-6 h-6 text-primary" />
                          Thanh toán khi nhận hàng (COD)
                        </div>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                          Nhân viên kho xác nhận xuất hàng → shipper giao tận
                          nơi → đại lý kiểm hàng &amp; trả tiền mặt → shipper
                          xác nhận đã giao &amp; thu tiền.
                        </p>
                      </div>

                      <div className="flex items-start gap-2 p-3 text-xs text-muted-foreground bg-muted/10 rounded-xl">
                        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>
                          Bằng cách đặt hàng, bạn đồng ý với điều khoản mua sỉ
                          của StoreSync B2B.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </form>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
