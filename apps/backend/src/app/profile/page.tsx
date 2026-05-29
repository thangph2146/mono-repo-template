"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
import Link from "next/link";
import { Camera, KeyRound, Loader2, MapPin, Save, Shield, UserCircle } from "lucide-react";
import { cn } from "@ui/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";
import { ScrollArea } from "@ui/components/scroll-area";
import { useAuth } from "@/providers/auth-provider";
import {
  canUserAccess,
  DEFAULT_API_URL,
  PERMISSION_CODES,
} from "@workspace/api-client";
import { permissionLabelVi } from "@/lib/permission-labels";
import {
  useChangeStaffPassword,
  useRbacCatalog,
  useStaffProfile,
  useUpdateStaffProfile,
} from "@/hooks/queries";
import { ApiError } from "@/lib/api";
import { patchAdminSessionProfile } from "@/lib/auth-session";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { TypographyH1 } from "@ui/components/typography";
import { ADMIN_PAGE_TITLE_PROFILE_CLASS } from "@ui/lib/layout-shell";
import type { RbacRole } from "@workspace/api-client";

function getRoleCode(role: { code?: string; name?: string }) {
  return role.code ?? role.name ?? "";
}

function getRoleLabel(role: { name?: string; displayName?: string }) {
  return role.displayName ?? role.name ?? "Chưa gán vai trò";
}

function normalizePermissionCodes(value: unknown): string[] {
  const visit = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap((item) => visit(item));
    }
    if (typeof input !== "string") {
      return [];
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return visit(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  };

  return [...new Set(visit(value))].sort((a, b) => a.localeCompare(b));
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

const PROFILE_CARD_CLASS =
  "border border-border/70 bg-card/95 shadow-sm backdrop-blur-sm";

const PROFILE_FIELD_CLASS =
  "h-10 rounded-lg border-border/70 bg-background/70 px-3 shadow-inner";

const PROFILE_TEXTAREA_CLASS =
  "min-h-28 rounded-lg border-border/70 bg-background/70 px-3 py-2.5 shadow-inner";

const PROFILE_ACTION_BAR_CLASS =
  "flex justify-end border-t border-border/60 pt-4";

function roleHasPermission(role: RbacRole, permCode: string): boolean {
  if (role.permissions.includes("*")) return true;
  return role.permissions.includes(permCode);
}

function getPermissionUiLabel(code: string): string {
  const viaDictionary = permissionLabelVi(code);
  if (viaDictionary !== code) {
    return viaDictionary;
  }

  return code
    .split(/[:._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function AdminProfilePageInner() {
  const { user: sessionUser } = useAuth();
  const canSeeRbacPage =
    sessionUser != null &&
    (canUserAccess(sessionUser, PERMISSION_CODES.RBAC_READ) ||
      canUserAccess(sessionUser, PERMISSION_CODES.USERS_MANAGE));
  const rbacCatalog = useRbacCatalog({ enabled: canSeeRbacPage });
  const userId = sessionUser?.id;
  const { data: profile, isLoading, isError, error } = useStaffProfile(userId);
  const updateProfile = useUpdateStaffProfile();
  const changePw = useChangeStaffPassword();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatar, setAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const roles = useMemo(
    () => profile?.roles ?? sessionUser?.roles ?? [],
    [profile?.roles, sessionUser?.roles],
  );
  const email = profile?.email ?? sessionUser?.email ?? "";
  const isStudent = roles.some(
    (r) => getRoleCode(r).trim().toLowerCase() === "student",
  );
  const canChangeAvatar = !isStudent || !avatar;
  const permissionCodes = normalizePermissionCodes(sessionUser?.permissions ?? []);
  const permissionRows = useMemo(() => {
    const assignedRoleCodes = new Set(
      roles.map((role) => getRoleCode(role).trim().toLowerCase()).filter(Boolean),
    );
    const runtimeAssignedRoles = (rbacCatalog.data?.roles ?? []).filter((role) =>
      assignedRoleCodes.has(role.code.trim().toLowerCase()),
    );

    const effectiveCodeSet = new Set(permissionCodes);
    for (const role of runtimeAssignedRoles) {
      for (const code of normalizePermissionCodes(role.permissions)) {
        effectiveCodeSet.add(code);
      }
    }

    return [...effectiveCodeSet]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((code) => {
        const grantedBy = runtimeAssignedRoles
          .filter((role) => roleHasPermission(role, code))
          .map((role) => ({
            code: role.code,
            name: role.name,
          }));

        return {
          code,
          label: getPermissionUiLabel(code),
          grantedBy,
        };
      });
  }, [permissionCodes, rbacCatalog.data?.roles, roles]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setAvatar(profile.avatar ?? "");
  }, [profile]);

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  const handleUploadAvatar = async (file: File) => {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folderPath", "avatars");
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/admin/uploads`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload thất bại");
      const json = (await res.json()) as { data?: { url?: string } };
      const url = json.data?.url;
      if (!url) throw new Error("Không nhận được URL ảnh");
      setAvatar(url);
      toast.success("Đã tải ảnh đại diện");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi upload ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  };

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
          avatar: avatar.trim() || null,
        },
      });
      patchAdminSessionProfile({
        name: u.fullName,
        phone: u.phone,
        address: u.address,
        image: u.avatar,
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

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PROFILE_CLASS}>
          Hồ sơ tài khoản
        </TypographyH1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Cập nhật tên, liên hệ, địa chỉ làm việc và mật khẩu đăng nhập admin.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được hồ sơ"}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div className="space-y-6">
          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <UserCircle className="size-5 text-primary" />
                Tài khoản đăng nhập
              </CardTitle>
              <CardDescription>
                Thông tin định danh của tài khoản đang dùng để truy cập cổng quản trị.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="size-20 shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="size-20 rounded-full border-2 border-border/60 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-border/60 bg-muted text-xl font-bold text-muted-foreground">
                      {fullName ? initials(fullName) : "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    value={email}
                    disabled
                    className={cn(PROFILE_FIELD_CLASS, "bg-muted/35")}
                  />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Email đăng nhập đang được quản trị tập trung từ hệ thống và không chỉnh trực tiếp ở màn này.
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                <p className="text-sm font-medium">Vai trò</p>
                <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
                  <ScrollArea className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2 pr-3">
                      {roles.map((r) => (
                        <Badge
                          key={getRoleCode(r)}
                          variant="secondary"
                          className="min-h-8 rounded-lg border border-border/60 bg-secondary/70 px-3 py-1.5 font-medium"
                          title={getRoleCode(r)}
                        >
                          {getRoleLabel(r)}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              {profile && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Trạng thái
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {profile.isActive ? "Đang hoạt động" : "Đã khoá"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cập nhật lần cuối
                    </p>
                    <p className="mt-1 truncate text-sm font-medium">
                      {formatDateTime(profile.updatedAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="size-5 text-primary" />
                Quyền hiệu lực (phiên đăng nhập)
              </CardTitle>
              <CardDescription>
                Hiển thị theo bảng để đối chiếu giữa quyền hiệu lực thực tế và vai trò động đang cấp quyền trong hệ thống.
              </CardDescription>
              <CardAction>
                <Badge variant="outline" className="rounded-lg px-2.5 py-1 font-medium">
                  {permissionRows.length} quyền
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Vai trò đang gán
                  </p>
                  <p className="mt-1 text-sm font-semibold">{roles.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Quyền hiệu lực
                  </p>
                  <p className="mt-1 text-sm font-semibold">{permissionRows.length}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nguồn đối chiếu
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {rbacCatalog.data?.roles?.length ? "RBAC runtime" : "Session hiện tại"}
                  </p>
                </div>
              </div>

              {rbacCatalog.isError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Không tải được catalog RBAC động, bảng đang fallback theo permission từ session hiện tại.
                </div>
              ) : null}

              {permissionRows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/15 px-4 py-6 text-sm text-muted-foreground">
                  Chưa có dữ liệu quyền cho phiên đăng nhập này.
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border/60 bg-background/70">
                  <ScrollArea className="max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/35 hover:bg-muted/35">
                          <TableHead className="min-w-[220px] px-3 py-3 font-semibold">
                            Quyền
                          </TableHead>
                          <TableHead className="min-w-[170px] px-3 py-3 font-semibold">
                            Mã kỹ thuật
                          </TableHead>
                          <TableHead className="min-w-[220px] px-3 py-3 font-semibold">
                            Cấp qua vai trò
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissionRows.map((permission) => (
                          <TableRow key={permission.code}>
                            <TableCell className="px-3 py-3 align-top whitespace-normal">
                              <div className="text-sm font-semibold leading-relaxed text-foreground">
                                {permission.label}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 align-top whitespace-normal">
                              <code className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                                {permission.code}
                              </code>
                            </TableCell>
                            <TableCell className="px-3 py-3 align-top whitespace-normal">
                              {permission.grantedBy.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {permission.grantedBy.map((role) => (
                                    <Badge
                                      key={`${permission.code}-${role.code}`}
                                      variant="secondary"
                                      className="min-h-7 rounded-lg border border-border/60 bg-secondary/60 px-2.5 py-1 text-xs font-medium"
                                      title={role.code}
                                    >
                                      {role.name}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Quyền đang có trong session, chưa đối chiếu được role nguồn.
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
              {canSeeRbacPage ? (
                <p className="text-sm">
                  <Link
                    href="/rbac"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Mở trang phân quyền
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-primary" />
                Thông tin liên hệ & địa chỉ
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin liên hệ để đồng bộ cho hồ sơ quản trị và các màn nội bộ liên quan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="size-20 rounded-full border-2 border-border/60 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-border/60 bg-muted text-lg font-bold text-muted-foreground">
                      {fullName ? initials(fullName) : "?"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar || !canChangeAvatar}
                    className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent disabled:opacity-50"
                    title="Tải ảnh đại diện"
                  >
                    <Camera className="size-3.5 text-muted-foreground" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUploadAvatar(file);
                    }}
                  />
                 
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Label htmlFor="admin-avatar-url">URL ảnh đại diện</Label>
                  <Input
                    id="admin-avatar-url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    disabled={isLoading || !profile || !canChangeAvatar}
                    placeholder="https://example.com/avatar.jpg"
                    className={PROFILE_FIELD_CLASS}
                  />
                   {isStudent && avatar && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bạn chỉ được tải ảnh đại diện một lần.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-fullName">Họ và tên</Label>
                <Input
                  id="admin-fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading || !profile}
                  className={PROFILE_FIELD_CLASS}
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
                  className={PROFILE_FIELD_CLASS}
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
                  className={PROFILE_TEXTAREA_CLASS}
                />
              </div>
              <div className={PROFILE_ACTION_BAR_CLASS}>
                <Button
                  type="button"
                  className="min-w-32 rounded-lg"
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

          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound className="size-5 text-primary" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Đặt lại mật khẩu cho phiên đăng nhập quản trị. Mật khẩu mới cần từ 6 ký tự trở lên.
              </CardDescription>
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
                  className={PROFILE_FIELD_CLASS}
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
                  className={PROFILE_FIELD_CLASS}
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
                  className={PROFILE_FIELD_CLASS}
                />
              </div>
              <div className={PROFILE_ACTION_BAR_CLASS}>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-w-40 rounded-lg"
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
        </div>
      </div>
    </PageSection>
  );
}

export default function AdminProfilePage() {
  return (
    <AdminPageGuard>
      <AdminProfilePageInner />
    </AdminPageGuard>
  );
}
