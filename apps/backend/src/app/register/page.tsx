"use client";

import Link from "next/link";
import { ArrowLeft, Headphones, ShieldCheck, UserPlus } from "lucide-react";
import { buttonVariants } from "@ui/components/button";
import { cn } from "@ui/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { ADMIN_INFO_CARD_CLASS } from "@/lib/admin-ui";
import {
  DEALER_SUPPORT_HOTLINE,
  DEALER_SUPPORT_REGISTER_HINT,
  DEALER_SUPPORT_TITLE,
} from "@workspace/dealer-support";

const STOREFRONT_BASE = (
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export default function AdminRegisterInfoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <Card className={ADMIN_INFO_CARD_CLASS}>
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-xl w-fit">
            <UserPlus className="size-10 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            Tài khoản cổng quản trị
          </CardTitle>
          <CardDescription className="text-base text-pretty">
            B2B Admin{" "}
            <strong className="text-foreground font-medium">
              không mở đăng ký công khai
            </strong>
            . Chỉ tài khoản nội bộ (quản trị, kho, kinh doanh, giao vận…) được
            phép đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <p className="flex gap-2">
              <Headphones className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-semibold text-foreground">{DEALER_SUPPORT_TITLE}</span>{" "}
                ({STOREFRONT_BASE}
                /support): {DEALER_SUPPORT_REGISTER_HINT} Tổng đài{" "}
                <a
                  href={DEALER_SUPPORT_HOTLINE.telHref}
                  className="font-mono font-semibold text-foreground underline-offset-2 hover:underline"
                >
                  {DEALER_SUPPORT_HOTLINE.display}
                </a>
                .
              </span>
            </p>
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Người có quyền{" "}
                <span className="font-mono text-xs text-foreground">
                  users.manage
                </span>{" "}
                có thể tạo tài khoản và gán vai trò trong mục{" "}
                <strong className="text-foreground">Nhân sự & phân quyền</strong>{" "}
                sau khi đã đăng nhập.
              </span>
            </p>
            <p>
              Khách / đại lý mua hàng vui lòng dùng{" "}
              <strong className="text-foreground">trang cửa hàng</strong>, không
              dùng cổng này.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="/login"
              className={cn(
                buttonVariants(),
                "rounded-xl gap-2 w-full sm:w-auto justify-center",
              )}
            >
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
