"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Container, Page, PageContent } from "@ui/components/layout";
import { ExternalLink, LogOut, MapPin, Navigation, Phone, ShieldCheck, Store } from "lucide-react";
import accounts from "@ui/data/accounts.json";
import { useSession } from "@/hooks/use-session";

type MockAccount = {
  id: string;
  username: string;
  role: "admin" | "store";
  displayName: string;
  phone: string;
  ownerName: string;
  storeName: string;
  address: string;
  mapQuery: string;
  quickAddresses: string[];
};

export default function ProfilePage() {
  const router = useRouter();
  const session = useSession();
  const [selectedAddress, setSelectedAddress] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("storesync_session");
    if (!raw) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("storesync_session");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "storesync_session" }),
    );
    router.push("/login");
  };

  if (!session) return null;

  const account = accounts.find((item) => item.id === session.id) as MockAccount | undefined;
  const ownerName = account?.ownerName ?? session.displayName;
  const storeName = account?.storeName ?? "Cửa hàng chưa cập nhật";
  const phone = account?.phone ?? "Chưa cập nhật";
  const defaultAddress = account?.address ?? "Chưa cập nhật địa chỉ";
  const quickAddresses = account?.quickAddresses ?? [defaultAddress];
  const currentAddress = selectedAddress || defaultAddress;
  const mapQuery = encodeURIComponent(currentAddress);
  const mapIframeUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

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
                  <CardTitle className="text-3xl font-black">Trang cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Tên chủ sở hữu</p>
                    <p className="font-bold text-lg flex items-center gap-2">
                      {session.role === "admin" ? <ShieldCheck className="w-4 h-4 text-primary" /> : <Store className="w-4 h-4 text-primary" />}
                      {ownerName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Tên cửa hàng</p>
                    <p className="font-bold text-lg">{storeName}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Số điện thoại liên hệ</p>
                    <p className="font-bold text-lg flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      {phone}
                    </p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30">
                    <p className="text-sm text-muted-foreground">Tên đăng nhập</p>
                    <p className="font-bold text-lg">{session.username}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/40 p-4 bg-surface/30 space-y-2">
                    <p className="text-sm text-muted-foreground">Địa chỉ cửa hàng</p>
                    <p className="font-bold text-base flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      {currentAddress}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href={session.role === "admin" ? "/admin/orders" : "/dashboard"}>
                      <Button variant="outline">Về trang làm việc</Button>
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
                    <Navigation className="w-5 h-5 text-primary" />
                    Vị trí cửa hàng trên Google Maps
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Chọn nhanh địa chỉ mẫu để kiểm tra vị trí hiển thị trên bản đồ.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {quickAddresses.map((address) => (
                      <Button
                        key={address}
                        variant={address === currentAddress ? "default" : "outline"}
                        size="sm"
                        className="rounded-lg"
                        onClick={() => setSelectedAddress(address)}
                      >
                        {address}
                      </Button>
                    ))}
                  </div>

                  <div className="rounded-xl overflow-hidden border border-outline-variant/40 bg-muted/20">
                    <iframe
                      title="Google Map cửa hàng"
                      src={mapIframeUrl}
                      className="w-full h-[380px] border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <Link href={mapExternalUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Mở Google Maps trong tab mới
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </PageContent>
    </Page>
  );
}
