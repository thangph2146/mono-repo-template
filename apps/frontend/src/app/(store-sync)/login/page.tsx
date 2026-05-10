"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import { Store, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { hydrateCartAfterLogin } from "@/lib/cart-sync";

const STORAGE_KEY = "storesync_session";

function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(
    () => safeNext(searchParams.get("next")),
    [searchParams],
  );

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
      return;
    }
    setSubmitting(true);
    try {
      const user = await api.users.login({
        email: email.trim(),
        password,
      });
      if (!user) {
        toast.error("Sai tài khoản hoặc mật khẩu");
        return;
      }
      const isAdmin = user.roles?.some(
        (r) => r.code === "admin" || r.code === "super_admin",
      );
      const session = {
        id: String(user.id),
        username: user.email,
        role: isAdmin ? "admin" : "store",
        displayName: user.fullName,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      window.dispatchEvent(new Event("storesync-session"));
      try {
        await hydrateCartAfterLogin(user.id);
      } catch {
        toast.warning("Không tải được giỏ hàng từ máy chủ — dùng giỏ trên máy");
      }
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Xin chào ${user.fullName}`);
      router.push(nextPath);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không kết nối được máy chủ";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8">
            <div className="w-full min-h-[calc(100vh-220px)] py-6 md:py-10 grid place-items-center">
              <Card className="w-[min(100%,28rem)] min-w-[22rem] border-border shadow-level-2">
                <CardHeader className="space-y-2 text-center pb-6">
                  <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                    <Store className="text-primary w-8 h-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">StoreSync B2B</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Hệ thống quản lý đại lý và mua sỉ
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@storesync.vn"
                        className="pl-10 h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password-login" className="text-sm font-medium">Mật khẩu</Label>
                      <Link
                        href="/support"
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password-login"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        className="pl-10 h-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleLogin();
                        }}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full h-12 text-base font-bold mt-6"
                    size="lg"
                    disabled={submitting}
                    onClick={() => void handleLogin()}
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Đăng nhập hệ thống
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Chưa có tài khoản đại lý?{" "}
                    <Link href="/register" className="text-primary font-semibold hover:underline">
                      Đăng ký ngay
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <PageContent className="px-0 md:px-0 py-8 md:py-10 grid place-items-center min-h-[50vh]">
            <Loader2 className="size-10 animate-spin text-primary" />
          </PageContent>
        </Page>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
