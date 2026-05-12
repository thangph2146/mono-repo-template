"use client";

import Link from "next/link";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Headphones, Store, Phone, Lock, User, MapPin } from "lucide-react";
import { Container, PageContent } from "@ui/components/layout";
import { STORE_AUTH_FORM_CARD_CLASS } from "@/lib/store-ui";
import { toast } from "sonner";
import {
  DEALER_SUPPORT_HOTLINE,
  DEALER_SUPPORT_REGISTER_HINT,
  DEALER_SUPPORT_TITLE,
} from "@workspace/dealer-support";

export default function RegisterPage() {
  return (
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
          <Container max="3xl" className="px-4 md:px-8">
            <div className="w-full min-h-[calc(100vh-220px)] py-6 md:py-10 grid place-items-center">
              <Card className={STORE_AUTH_FORM_CARD_CLASS}>
                <CardHeader className="space-y-2 text-center pb-6">
                  <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                    <Store className="text-primary w-8 h-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">Đăng ký Đại lý</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Tạo tài khoản để nhận báo giá khuyến mãi và ưu đãi nhập hàng
                  </CardDescription>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-left text-sm text-muted-foreground">
                    <p className="flex gap-2">
                      <Headphones className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>
                        {DEALER_SUPPORT_REGISTER_HINT}{" "}
                        <Link href="/support" className="font-semibold text-primary hover:underline">
                          {DEALER_SUPPORT_TITLE}
                        </Link>
                        {" — "}
                        <a
                          href={DEALER_SUPPORT_HOTLINE.telHref}
                          className="font-mono font-semibold text-foreground underline-offset-2 hover:underline"
                        >
                          {DEALER_SUPPORT_HOTLINE.display}
                        </a>
                      </span>
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="store-name" className="text-sm font-medium">Tên Cửa hàng / Đại lý *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="store-name" type="text" placeholder="VD: Tạp hóa cô Ba" className="pl-10 h-12" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reg-phone" className="text-sm font-medium">Số điện thoại liên hệ *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="reg-phone" type="tel" placeholder="0912..." className="pl-10 h-12" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-sm font-medium">Địa chỉ Cửa hàng *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="address" type="text" placeholder="Số nhà, Đường, Quận..." className="pl-10 h-12" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reg-username" className="text-sm font-medium">Tên đăng nhập mong muốn *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="reg-username" type="text" placeholder="Nhập tên đăng nhập" className="pl-10 h-12" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="reg-password" className="text-sm font-medium">Mật khẩu *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input id="reg-password" type="password" placeholder="Tạo mật khẩu an toàn" className="pl-10 h-12" />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-bold mt-2"
                    variant="secondary"
                    size="lg"
                    onClick={() => toast.success("Đã gửi yêu cầu đăng ký. Bộ phận CSKH sẽ liên hệ sớm.")}
                  >
                    Gửi Yêu cầu Đăng ký
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                      Đăng nhập
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
      </PageContent>
  );
}
