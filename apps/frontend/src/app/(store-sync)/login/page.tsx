"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Store, Lock, User } from "lucide-react";
import { Container, Page, PageContent } from "@/components/shared/layout";
import { toast } from "sonner";
import accounts from "@/data/accounts.json";

export default function LoginRegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isDevMode = process.env.NODE_ENV === "development";

  const handleLogin = () => {
    const account = accounts.find(
      (item) => item.username === username.trim() && item.password === password,
    );

    if (!account) {
      toast.error("Sai tài khoản hoặc mật khẩu");
      return;
    }

    localStorage.setItem(
      "storesync_session",
      JSON.stringify({
        id: account.id,
        username: account.username,
        role: account.role,
        displayName: account.displayName,
      }),
    );

    toast.success(`Xin chào ${account.displayName}`);
    router.push(account.role === "admin" ? "/admin/orders" : "/dashboard");
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
                  {isDevMode && (
                    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <p className="text-xs font-bold text-primary">Chọn nhanh tài khoản test (DEV)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {accounts.map((account) => (
                          <Button
                            key={account.id}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-xs justify-start px-2.5"
                            onClick={() => {
                              setUsername(account.username);
                              setPassword(account.password);
                            }}
                          >
                            {account.role === "admin" ? "Admin" : "Cửa hàng"} - {account.username}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-sm font-medium">Tên đăng nhập</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Nhập tài khoản"
                        className="pl-10 h-12"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password-login" className="text-sm font-medium">Mật khẩu</Label>
                      <Link href="/support" className="text-sm text-primary font-medium hover:underline">
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
                          if (e.key === "Enter") handleLogin();
                        }}
                      />
                    </div>
                  </div>
                  <Button className="w-full h-12 text-base font-bold mt-6" size="lg" onClick={handleLogin}>
                    Đăng nhập hệ thống
                  </Button>
                  <p className="text-sm text-center text-muted-foreground">
                    Chưa có tài khoản đại lý?{" "}
                    <Link href="/register" className="text-primary font-semibold hover:underline">
                      Đăng ký ngay
                    </Link>
                  </p>
                  {isDevMode && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl">
                      Demo: admin/admin123 (quản trị) hoặc cuahangso1/store123 (chủ cửa hàng)
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
