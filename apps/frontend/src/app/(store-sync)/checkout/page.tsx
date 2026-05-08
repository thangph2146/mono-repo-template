"use client";

import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Trash2, Tag, Truck, Banknote, HelpCircle } from "lucide-react";
import { Container, Page, PageContent } from "@ui/components/layout";

export default function CheckoutPage() {
  const router = useRouter();

  const handlePlaceOrder = () => {
    toast.success("Đặt hàng thành công! Đơn hàng sẽ được thanh toán COD khi nhận.", {
      description: "Chuyển hướng đến Quản lý Đơn hàng...",
    });
    setTimeout(() => {
      router.push("/orders");
    }, 900);
  };

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8 space-y-8">
            <div className="flex items-center gap-6 mb-8">
              <Link href="/catalog">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-background hover:bg-muted shadow-sm border-outline-variant transition-transform hover:scale-105">
                  <ArrowLeft className="w-7 h-7 text-primary" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-extrabold text-foreground">Giỏ hàng thanh toán</h1>
                <p className="text-lg text-on-surface-variant font-medium mt-1">Kiểm tra lại danh sách sản phẩm trước khi đặt hàng</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-outline-variant shadow-sm overflow-hidden bg-background rounded-3xl">
                  <CardHeader className="bg-surface border-b border-outline-variant pb-5">
                    <CardTitle className="text-2xl flex items-center justify-between">
                      <span className="font-bold">Danh sách sản phẩm (2)</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1">Đã áp dụng Giá sỉ Gold</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-outline-variant/30">
                      {/* Item 1 */}
                      <div className="p-8 flex flex-col sm:flex-row gap-8 items-center hover:bg-muted/5 transition-colors">
                        <div className="w-32 h-32 bg-white border border-outline-variant/50 rounded-2xl flex-shrink-0 flex items-center justify-center p-3 shadow-sm">
                          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-5MIMJYegmXMs4WyemXVbNzwCVDSBCPEE5Q45ACmYPfLmOVzjdqQv5rGqXkwG0AeU9B_RsEXVVXOXHXmjdbx_kgLpuIf3tiqUZWrUT1ISeVW4URC4pmq7dFJf6dF9ObCBU5TfdxBu0ARsPhzJ8OG_kaEPEguZYM12n-ZLvT8nL_wQxJIztupPlWNx_yUZIAfchDxZ5oDctVMM-ipK-XabO5I-rTLUuYo-kmAsbnkXehFso2IDImjDe85FcC8KRoo0T1zbvh3Z70E" className="max-h-full object-contain" alt="Coca" />
                        </div>
                        <div className="flex-grow text-center sm:text-left">
                          <div className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Nước giải khát</div>
                          <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight">Thùng 24 lon Nước Ngọt Có Ga Coca-Cola 320ml</h3>
                          <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                            <span className="text-outline line-through text-base">200.000đ</span>
                            <span className="font-extrabold text-foreground text-2xl">185.000đ</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm h-14">
                            <Button variant="ghost" className="h-full w-14 rounded-none hover:bg-muted transition-colors"><Minus className="w-5 h-5" /></Button>
                            <div className="w-14 text-center font-extrabold text-xl">5</div>
                            <Button variant="ghost" className="h-full w-14 rounded-none hover:bg-muted transition-colors"><Plus className="w-5 h-5" /></Button>
                          </div>
                          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 h-14 w-14 rounded-2xl transition-all">
                            <Trash2 className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="p-8 flex flex-col sm:flex-row gap-8 items-center hover:bg-muted/5 transition-colors">
                        <div className="w-32 h-32 bg-white border border-outline-variant/50 rounded-2xl flex-shrink-0 flex items-center justify-center p-3 shadow-sm">
                          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyrWT2YwfoQjQ8JTUUKPO3oUThhOjabvaCaigudtT2AnT4Fl9KwMhwru5roS76Xpb9l743b81FU605aOA3ISWCL-ZWih9Sg4pIypvMlyXAgQ_RvKkoFrneEL-i3fZZl66BkSVLvdjCMZefKV2Iv5gygNggGqyJyGk71dTHmnuLfv251bdNIAUbqoikJIdk8ewGjNBsBFwdHYpJkBCoFsjlT0JHTYsYcyrxj_n9aXf1ptJFDkTlRjks3OvZydi28RNe69etc6zGIDY" className="max-h-full object-contain" alt="Noodle" />
                        </div>
                        <div className="flex-grow text-center sm:text-left">
                          <div className="text-xs font-bold text-primary mb-2 uppercase tracking-widest">Thực phẩm khô</div>
                          <h3 className="font-bold text-xl mb-2 line-clamp-2 leading-tight">Thùng 30 gói Mì Hảo Hảo Tôm Chua Cay 75g</h3>
                          <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                            <span className="text-outline line-through text-base">130.000đ</span>
                            <span className="font-extrabold text-foreground text-2xl">110.000đ</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm h-14">
                            <Button variant="ghost" className="h-full w-14 rounded-none hover:bg-muted transition-colors"><Minus className="w-5 h-5" /></Button>
                            <div className="w-14 text-center font-extrabold text-xl">10</div>
                            <Button variant="ghost" className="h-full w-14 rounded-none hover:bg-muted transition-colors"><Plus className="w-5 h-5" /></Button>
                          </div>
                          <Button variant="ghost" className="text-destructive hover:bg-destructive/10 h-14 w-14 rounded-2xl transition-all">
                            <Trash2 className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-outline-variant shadow-sm bg-background rounded-3xl overflow-hidden">
                  <CardHeader className="bg-surface border-b border-outline-variant pb-5">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Truck className="w-6 h-6 text-primary" />
                      Ghi chú cho Đơn vị Vận chuyển
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Input
                      placeholder="Ví dụ: Giao hàng vào buổi sáng, gọi trước 15 phút..."
                      className="h-16 text-lg bg-surface border-outline-variant rounded-2xl focus:ring-primary/20"
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="py-0 border-primary shadow-xl sticky top-24 bg-background rounded-[2rem] overflow-hidden">
                  <CardHeader className="bg-primary text-primary-foreground p-8 text-center">
                    <CardTitle className="text-3xl font-extrabold">Tổng thanh toán</CardTitle>
                    <p className="text-primary-fixed-dim/90 font-medium mt-1">Giao hàng miễn phí cho Đại lý</p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-on-surface-variant font-medium">Tạm tính (15 thùng)</span>
                      <span className="font-bold text-foreground">2.025.000đ</span>
                    </div>

                    <div className="flex justify-between text-lg items-center">
                      <span className="text-on-surface-variant flex items-center gap-2 font-medium">
                        <Tag className="w-5 h-5 text-primary" /> Mã giảm B2B_GOLD (5%)
                      </span>
                      <span className="font-bold text-destructive">- 101.250đ</span>
                    </div>

                    <div className="flex justify-between text-lg items-center">
                      <span className="text-on-surface-variant flex items-center gap-2 font-medium">
                        <Truck className="w-5 h-5 text-primary" /> Phí vận chuyển
                      </span>
                      <span className="font-bold text-success uppercase tracking-wider text-sm">Miễn phí</span>
                    </div>

                    <div className="border-t border-outline-variant/40 border-dashed pt-8 mt-4">
                      <div className="flex flex-col gap-2 mb-8">
                        <span className="text-xl font-bold text-on-surface-variant">Thành tiền cuối cùng</span>
                        <div className="flex items-baseline justify-between">
                          <span className="text-5xl font-black text-primary tracking-tighter">1.923.750đ</span>
                        </div>
                        <span className="text-sm text-outline font-medium mt-1">Đã bao gồm thuế VAT & phí dịch vụ</span>
                      </div>

                      <Button
                        size="lg"
                        className="w-full h-20 text-2xl font-black rounded-[1.25rem] shadow-2xl hover:scale-[1.02] transition-all hover:bg-surface-tint active:scale-95 group"
                        onClick={handlePlaceOrder}
                      >
                        ĐẶT HÀNG NGAY
                        <ArrowLeft className="w-6 h-6 ml-2 rotate-180 transition-transform group-hover:translate-x-1" />
                      </Button>

                      <div className="mt-8 p-5 bg-muted/30 rounded-2xl border border-outline-variant/30">
                        <div className="flex items-center gap-3 text-foreground font-bold">
                          <Banknote className="w-6 h-6 text-primary" />
                          Thanh toán khi nhận hàng (COD)
                        </div>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                          Đại lý vui lòng kiểm tra hàng và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                        </p>
                      </div>

                      <div className="mt-4 flex items-start gap-2 p-3 text-xs text-muted-foreground bg-muted/10 rounded-xl">
                        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Bằng cách đặt hàng, bạn đồng ý với các điều khoản mua bán sỉ của StoreSync B2B.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
