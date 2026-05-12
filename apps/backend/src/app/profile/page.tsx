"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import { KeyRound, Loader2, MapPin, Save, Shield, UserCircle } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import {
  canUserAccess,
  PERMISSION_CODES,
} from "@workspace/api-client";
import { permissionLabelVi } from "@/lib/permission-labels";
import {
  useChangeStaffPassword,
  useStaffProfile,
  useUpdateStaffProfile,
} from "@/hooks/queries";
import { ApiError } from "@/lib/api";
import { patchAdminSessionProfile } from "@/lib/auth-session";
import { Container } from "@ui/components/layout";
import { ADMIN_PAGE_TITLE_PROFILE_CLASS } from "@ui/lib/layout-shell";

export default function AdminProfilePage() {
  const { user: sessionUser } = useAuth();
  const canSeeRbacPage =
    sessionUser != null &&
    (canUserAccess(sessionUser, PERMISSION_CODES.RBAC_READ) ||
      canUserAccess(sessionUser, PERMISSION_CODES.USERS_MANAGE));
  const userId = sessionUser?.id;
  const { data: profile, isLoading, isError, error } = useStaffProfile(userId);
  const updateProfile = useUpdateStaffProfile();
  const changePw = useChangeStaffPassword();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!userId) return;
    const name = fullName.trim();
    if (!name) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }
    try {
      const u = await updateProfile.mutateAsync({
        id: userId,
        input: {
          fullName: name,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        },
      });
      patchAdminSessionProfile({
        fullName: u.fullName,
        phone: u.phone,
        address: u.address,
        updatedAt: u.updatedAt,
      });
      toast.success("Đã cập nhật hồ sơ");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Lỗi lưu hồ sơ");
    }
  };

  const handleChangePassword = async () => {
    if (!userId) return;
    if (!currentPassword) {
      toast.error("Nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Nhập lại mật khẩu mới không khớp");
      return;
    }
    try {
      await changePw.mutateAsync({
        id: userId,
        input: {
          currentPassword,
          newPassword,
        },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đã đổi mật khẩu");
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Không đổi được mật khẩu",
      );
    }
  };

  if (!sessionUser) {
    return null;
  }

  const roles = profile?.roles ?? sessionUser.roles;
  const email = profile?.email ?? sessionUser.email;

  return (
    <Container max="4xl" className="space-y-6">
      <div>
        <h1 className={ADMIN_PAGE_TITLE_PROFILE_CLASS}>Hồ sơ tài khoản</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Cập nhật tên, liên hệ, địa chỉ làm việc và mật khẩu đăng nhập admin.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được hồ sơ"}
        </p>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <UserCircle className="size-5 text-primary" />
            Tài khoản đăng nhập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              value={email}
              disabled
              className="bg-muted/40"
            />
            <p className="text-xs text-muted-foreground">
              Đổi email cần quản trị hệ thống / API riêng.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Vai trò</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <Badge
                  key={r.code}
                  variant="secondary"
                  className="font-normal"
                >
                  {r.name}
                  <span className="ml-1.5 text-muted-foreground font-mono text-[10px]">
                    {r.code}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
          {profile && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Trạng thái</p>
                <p className="font-medium">
                  {profile.isActive ? "Đang hoạt động" : "Đã khoá"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Cập nhật lần cuối</p>
                <p className="font-medium font-mono text-xs truncate">
                  {new Date(profile.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="size-5 text-primary" />
            Quyền hiệu lực (phiên đăng nhập)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Hợp quyền từ mọi vai trò được gán. Mã kỹ thuật hiển thị kèm để đối chiếu với API / ma trận RBAC.
          </p>
          <div className="flex flex-wrap gap-2">
            {(sessionUser.permissions ?? []).length === 0 ? (
              <span className="text-sm text-muted-foreground">Chưa có dữ liệu quyền.</span>
            ) : (
              sessionUser.permissions.map((code) => (
                <Badge
                  key={code}
                  variant="outline"
                  className="font-normal text-xs max-w-full whitespace-normal text-left h-auto py-1.5"
                  title={code}
                >
                  <span className="block font-medium">
                    {permissionLabelVi(code)}
                  </span>
                  {permissionLabelVi(code) !== code ? (
                    <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
                      {code}
                    </span>
                  ) : null}
                </Badge>
              ))
            )}
          </div>
          {canSeeRbacPage ? (
            <p className="text-xs">
              <Link
                href="/staff"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Mở trang nhân sự & ma trận phân quyền
              </Link>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="size-5 text-primary" />
            Thông tin liên hệ & địa chỉ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-fullName">Họ và tên</Label>
            <Input
              id="admin-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading || !profile}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-phone">Số điện thoại</Label>
            <Input
              id="admin-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading || !profile}
              placeholder="VD: 0901234567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-address">Địa chỉ / văn phòng</Label>
            <Textarea
              id="admin-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading || !profile}
              placeholder="Địa chỉ liên hệ khi cần (không bắt buộc)"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={isLoading || !profile || updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span className="ml-2">Lưu hồ sơ</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-5 text-primary" />
            Đổi mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-current-pw">Mật khẩu hiện tại</Label>
            <Input
              id="admin-current-pw"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-new-pw">Mật khẩu mới</Label>
            <Input
              id="admin-new-pw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-pw">Nhập lại mật khẩu mới</Label>
            <Input
              id="admin-confirm-pw"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleChangePassword()}
              disabled={changePw.isPending}
            >
              {changePw.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              <span className="ml-2">Đổi mật khẩu</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
