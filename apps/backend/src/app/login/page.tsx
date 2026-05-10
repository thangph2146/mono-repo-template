"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { useAuth, useClientReady } from "@/providers/auth-provider";
import {
  DEV_DEMO_ACCOUNTS,
  isDevDemoLoginEnabled,
} from "@/lib/dev-demo-accounts";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const clientReady = useClientReady();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const staffOnlyToastRef = useRef(false);

  useEffect(() => {
    if (clientReady && user) router.replace("/");
  }, [clientReady, user, router]);

  useEffect(() => {
    if (!clientReady || staffOnlyToastRef.current) return;
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("reason") !== "staff_only") return;
    staffOnlyToastRef.current = true;
    toast.error(
      "Tài khoản khách / đại lý không dùng được cổng quản trị. Hãy đăng nhập trên cửa hàng để đặt hàng.",
    );
    router.replace("/login", { scroll: false });
  }, [clientReady, router]);

  if (!clientReady || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 text-muted-foreground text-sm">
        {!clientReady ? "Đang tải…" : "Đang chuyển…"}
      </div>
    );
  }

  const runLogin = async (e: string, p: string) => {
    setBusy(true);
    try {
      const result = await login(e, p);
      if (result === "invalid_credentials") {
        toast.error("Sai email hoặc mật khẩu.");
        return;
      }
      if (result === "staff_only") {
        toast.error(
          "Tài khoản này chỉ dùng trên cửa hàng (khách/đại lý). Cổng quản trị cần tài khoản nội bộ.",
        );
        return;
      }
      toast.success("Đăng nhập thành công.");
      router.replace("/");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runLogin(email, password);
  };

  const showDevPicker = isDevDemoLoginEnabled();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="bg-primary/10 p-3 rounded-xl">
            <ShieldCheck className="size-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">B2B Admin</h1>
          <p className="text-sm text-muted-foreground text-center">
            Chỉ tài khoản nội bộ (quản trị, kho, kinh doanh…). Khách / đại lý vui
            lòng dùng trang cửa hàng.
          </p>
        </div>

        {showDevPicker && (
          <div className="mb-8 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
              Chế độ phát triển — chọn tài khoản seed
            </p>
            <div className="flex flex-wrap gap-2">
              {DEV_DEMO_ACCOUNTS.map((acc) => (
                <div key={acc.email} className="flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-8"
                    disabled={busy}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.password);
                    }}
                    title={acc.description}
                  >
                    {acc.label}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-2 text-muted-foreground"
                    disabled={busy}
                    title={`Đăng nhập ngay: ${acc.email}`}
                    onClick={() => void runLogin(acc.email, acc.password)}
                  >
                    →
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Nút tên: điền form. Mũi tên: đăng nhập luôn (cần API đã seed).
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
              placeholder="admin@storesync.local"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sau khi vào hệ thống, menu và nút thao tác khớp{" "}
          <span className="font-medium text-foreground">quyền ghi</span> trên
          API (ví dụ chỉ xem kho nếu không có{" "}
          <span className="font-mono">products.write</span>).
        </p>
      </div>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground hover:text-primary"
      >
        ← Về trang chủ admin
      </Link>
    </div>
  );
}
