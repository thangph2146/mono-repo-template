"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Container, Page, PageContent } from "@ui/components/layout";
import { StoreLocationMapPicker } from "@/components/shared/store-location-map-picker";
import { Loader2, LogOut, MapPin, Save, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { useUpdateProfile, useUserById } from "@/hooks/queries";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api";

const STORAGE_KEY = "storesync_session";

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const sessionUserId = session?.id ? Number.parseInt(session.id, 10) : NaN;
  const userId = Number.isFinite(sessionUserId) ? sessionUserId : undefined;

  const { data: user, isLoading, isError, error } = useUserById(userId);
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session) router.push("/login");
  }, [session, router]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    router.push("/login");
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    const name = fullName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên hiển thị");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        id: userId,
        input: {
          fullName: name,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        },
      });
      toast.success("Đã lưu địa chỉ và thông tin liên hệ");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không lưu được hồ sơ";
      toast.error(message);
    }
  };

  const savedAddress = user?.address?.trim() ?? "";
  const addressLine =
    savedAddress || (isLoading ? "Đang tải…" : "Chưa cập nhật địa chỉ");
  const mapRecenterSignal = useMemo(
    () => `${user?.id ?? 0}-${user?.updatedAt ?? ""}`,
    [user?.id, user?.updatedAt],
  );

  if (!session) {
    return (
      <Page>
        <PageContent className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      <PageContent className="px-0 md:px-0 py-8 md:py-10 space-y-0">
        <section>
          <Container max="8xl" className="px-4 md:px-8">
            <div className="min-h-[60vh] grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Card className="w-full border-outline-variant">
                <CardHeader className="space-y-3">
                  <Badge className="w-fit bg-primary/10 text-primary border-primary/20">
                    {session.role === "admin" ? "Quản trị viên" : "Chủ cửa hàng"}
                  </Badge>
                  <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Trang cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isError && (
                    <p className="text-sm text-destructive">
                      {error instanceof Error ? error.message : "Không tải được hồ sơ."}
                    </p>
                  )}
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Tên chủ sở hữu</p>
                    <p className="font-bold text-lg flex items-center gap-2">
                      {session.role === "admin" ? (
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Store className="w-4 h-4 text-primary" />
                      )}
                      {isLoading ? "…" : fullName || session.displayName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-bold text-lg">{session.username}</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30 space-y-4">
                    <p className="text-sm font-medium text-foreground">
                      Cập nhật thông tin cửa hàng
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="profile-fullName">Tên hiển thị</Label>
                      <Input
                        id="profile-fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isLoading || !user}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Số điện thoại liên hệ</Label>
                      <Input
                        id="profile-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading || !user}
                        className="rounded-lg"
                        placeholder="VD: 0901234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-address">Địa chỉ cửa hàng / kho nhận</Label>
                      <Textarea
                        id="profile-address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={isLoading || !user}
                        className="rounded-lg min-h-[100px] resize-y"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={isLoading || !user || updateProfile.isPending}
                      onClick={() => void handleSaveProfile()}
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Lưu thông tin
                    </Button>
                  </div>

                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30 space-y-2">
                    <p className="text-sm text-muted-foreground">Địa chỉ đang lưu</p>
                    <p className="font-bold text-base flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{addressLine}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href="/orders">
                      <Button variant="outline">Đơn hàng của tôi</Button>
                    </Link>
                    <Button variant="destructive" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full border-outline-variant">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl font-black flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Chọn vị trí cửa hàng trên bản đồ
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Click hoặc kéo ghim để điền địa chỉ chuẩn hoá vào ô bên trái; chỉnh tay
                    trong ô vẫn được. Nhớ bấm <strong>Lưu thông tin</strong> để ghi vào tài
                    khoản.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StoreLocationMapPicker
                    address={address}
                    onAddressChange={setAddress}
                    snapshotAddress={user?.address ?? ""}
                    recenterSignal={mapRecenterSignal}
                    disabled={isLoading || !user}
                  />
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
