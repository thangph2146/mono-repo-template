"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Container, Page, PageContent } from "@ui/components/layout";
import {
  STORE_CONTAINER_INSET,
  STORE_CONTAINER_MAX_AUTH,
  STORE_PAGE_CONTENT_CENTER_CLASS,
  STORE_PAGE_CONTENT_CLASS,
} from "@ui/lib/layout-shell";
import { Store, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { safeRelativeNext } from "@/lib/auth-routes";
import { hydrateCartAfterLogin } from "@/lib/cart-sync";
import { STORE_AUTH_FORM_CARD_CLASS } from "@/lib/store-ui";

const STORAGE_KEY = "storesync_session";

/** Chỉ dùng giao diện dev — khớp `apps/api` DatabaseSeeder. */
const DEV_PRESET_NONE = "__none__";
const DEV_ACCOUNT_PRESETS = [
  {
    value: "customer",
    email: "khach-demo@storesync.local",
    password: "demo",
    label: "Đại lý Nam Sơn (customer)",
  },
  {
    value: "sales",
    email: "sales@storesync.local",
    password: "demo",
    label: "NV kinh doanh (sales)",
  },
  {
    value: "manager",
    email: "manager@storesync.local",
    password: "demo",
    label: "Quản lý kho (manager)",
  },
  {
    value: "admin",
    email: "admin@storesync.local",
    password: "change-me",
    label: "Quản trị (admin) — mật khẩu seed mặc định",
  },
  {
    value: "super",
    email: "super@storesync.local",
    password: "demo",
    label: "Siêu quản trị (super_admin)",
  },
  {
    value: "hybrid",
    email: "hybrid@storesync.local",
    password: "demo",
    label: "Đa role (sales + customer)",
  },
] as const;

const IS_DEV = process.env.NODE_ENV === "development";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [devPreset, setDevPreset] = useState(DEV_PRESET_NONE);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(
    () => safeRelativeNext(searchParams.get("next")),
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
      void queryClient.invalidateQueries({ queryKey: ["users"] });
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
      <PageContent className={STORE_PAGE_CONTENT_CLASS}>
          <Container max={STORE_CONTAINER_MAX_AUTH} className={STORE_CONTAINER_INSET}>
              <Card className={STORE_AUTH_FORM_CARD_CLASS}>
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
                  {IS_DEV && (
                    <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 dark:bg-amber-950/30 px-3 py-3 space-y-2">
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-100/90">
                        Development: chọn tài khoản seed
                      </p>
                      <p className="text-[11px] text-amber-900/80 dark:text-amber-100/70 leading-snug">
                        Điền sẵn email và mật khẩu từ{" "}
                        <code className="font-mono">db:seed</code>. Không hiện ở
                        bản production.
                      </p>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="dev-account-preset"
                          className="text-xs font-medium"
                        >
                          Tài khoản mẫu
                        </Label>
                        <Select
                          value={devPreset}
                          onValueChange={(v) => {
                            const next = v ?? DEV_PRESET_NONE;
                            setDevPreset(next);
                            if (next === DEV_PRESET_NONE) return;
                            const p = DEV_ACCOUNT_PRESETS.find(
                              (x) => x.value === next,
                            );
                            if (p) {
                              setEmail(p.email);
                              setPassword(p.password);
                            }
                          }}
                        >
                          <SelectTrigger
                            id="dev-account-preset"
                            className="h-10 w-full rounded-lg bg-background text-sm"
                          >
                            <SelectValue placeholder="— Chọn để điền form —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DEV_PRESET_NONE}>
                              — Không dùng preset —
                            </SelectItem>
                            {DEV_ACCOUNT_PRESETS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}{" "}
                                <span className="text-muted-foreground font-mono text-[11px]">
                                  ({p.email})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
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
          </Container>
      </PageContent>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Page>
          <PageContent className={STORE_PAGE_CONTENT_CENTER_CLASS}>
            <Loader2 className="size-10 animate-spin text-primary" />
          </PageContent>
        </Page>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
