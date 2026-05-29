"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card"
import { Button } from "@ui/components/button"
import { Input } from "@ui/components/input"
import { Label } from "@ui/components/label"
import { Textarea } from "@ui/components/textarea"
import {
  Camera,
  KeyRound,
  Loader2,
  MapPin,
  Save,
} from "lucide-react"
import { cn } from "@ui/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { DEFAULT_API_URL } from "@workspace/api-client"

import {
  useChangeStaffPassword,
  useStaffProfile,
  useUpdateStaffProfile,
} from "@/hooks/queries"
import { ApiError } from "@/lib/api"
import { patchAdminSessionProfile } from "@/lib/auth-session"
import { PageSection } from "@ui/components/layout"
import { AdminPageGuard } from "@/components/admin-page-guard"
import { TypographyH1 } from "@ui/components/typography"
import { ADMIN_PAGE_TITLE_PROFILE_CLASS } from "@ui/lib/layout-shell"


function getRoleCode(role: { code?: string; name?: string }) {
  return role.code ?? role.name ?? ""
}

function formatDateTime(value?: string | null) {
  if (!value) return "Chưa có dữ liệu"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("vi-VN")
}

const PROFILE_CARD_CLASS =
  "border border-border/70 bg-card/95 shadow-sm backdrop-blur-sm"

const PROFILE_FIELD_CLASS =
  "h-10 rounded-lg border-border/70 bg-background/70 px-3 shadow-inner"

const PROFILE_TEXTAREA_CLASS =
  "min-h-28 rounded-lg border-border/70 bg-background/70 px-3 py-2.5 shadow-inner"

const PROFILE_ACTION_BAR_CLASS =
  "flex justify-end border-t border-border/60 pt-4"

function AdminProfilePageInner() {
  const { user: sessionUser } = useAuth()
  const userId = sessionUser?.id
  const { data: profile, isLoading, isError, error } = useStaffProfile(userId)
  const updateProfile = useUpdateStaffProfile()
  const changePw = useChangeStaffPassword()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [avatar, setAvatar] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const roles = useMemo(
    () => profile?.roles ?? sessionUser?.roles ?? [],
    [profile?.roles, sessionUser?.roles]
  )
  const email = profile?.email ?? sessionUser?.email ?? ""
  const isStudent = roles.some(
    (r) => getRoleCode(r).trim().toLowerCase() === "student"
  )
  const canChangeAvatar = !isStudent || !avatar

  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName ?? "")
    setPhone(profile.phone ?? "")
    setAddress(profile.address ?? "")
    setAvatar(profile.avatar ?? "")
  }, [profile])

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  const handleUploadAvatar = async (file: File) => {
    if (!userId) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folderPath", "avatars")
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
      ).replace(/\/$/, "")
      const res = await fetch(`${baseUrl}/admin/uploads`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) throw new Error("Upload thất bại")
      const json = (await res.json()) as { data?: { url?: string } }
      const url = json.data?.url
      if (!url) throw new Error("Không nhận được URL ảnh")
      setAvatar(url)
      toast.success("Đã tải ảnh đại diện")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi upload ảnh")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    const name = fullName.trim()
    if (!name) {
      toast.error("Vui lòng nhập họ tên")
      return
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
      })
      patchAdminSessionProfile({
        name: u.fullName,
        phone: u.phone,
        address: u.address,
        image: u.avatar,
        updatedAt: u.updatedAt,
      })
      toast.success("Đã cập nhật hồ sơ")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Lỗi lưu hồ sơ")
    }
  }

  const handleChangePassword = async () => {
    if (!userId) return
    if (!currentPassword) {
      toast.error("Nhập mật khẩu hiện tại")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Nhập lại mật khẩu mới không khớp")
      return
    }
    try {
      await changePw.mutateAsync({
        id: userId,
        input: {
          currentPassword,
          newPassword,
        },
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Đã đổi mật khẩu")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Không đổi được mật khẩu")
    }
  }

  if (!sessionUser) {
    return null
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PROFILE_CLASS}>
          Hồ sơ tài khoản
        </TypographyH1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Cập nhật tên, liên hệ, địa chỉ làm việc và mật khẩu đăng nhập admin.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được hồ sơ"}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.20fr)_minmax(0,0.80fr)]">
        <div className="space-y-6">
          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-primary" />
                Thông tin liên hệ & địa chỉ
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin liên hệ để đồng bộ cho hồ sơ quản trị và các
                màn nội bộ liên quan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-2.5">
                  <div className="relative aspect-[3/4] w-40 sm:w-60 shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Avatar"
                        className="h-full w-full rounded-lg border-2 border-border/60 object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-border/60 bg-muted text-lg font-bold text-muted-foreground">
                        {fullName ? initials(fullName) : "?"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar || !canChangeAvatar}
                      className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent disabled:opacity-50"
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
                        const file = e.target.files?.[0]
                        if (file) void handleUploadAvatar(file)
                      }}
                    />
                  </div>
                  {profile && (
                    <div className="flex w-full flex-col gap-2.5">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                          Trạng thái
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {profile.isActive ? "Đang hoạt động" : "Đã khoá"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                          Cập nhật lần cuối
                        </p>
                        <p className="mt-1 truncate text-sm font-medium">
                          {formatDateTime(profile.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex w-full flex-col gap-2.5">
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
                    <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span>
                        Bạn chỉ được tải ảnh đại diện{" "}
                        <strong>một lần duy nhất</strong>.
                      </span>
                    </div>
                  )}
                    {isStudent && !avatar && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-0.5 shrink-0"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>
                          <strong>Cảnh báo:</strong> bạn chỉ được tải ảnh đại
                          diện <strong>một lần duy nhất</strong>. Hãy chọn ảnh
                          phù hợp trước khi tải lên.
                        </span>
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
                      Email đăng nhập đang được quản trị tập trung từ hệ thống
                      và không chỉnh trực tiếp ở màn này.
                    </p>
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
                      disabled={
                        isLoading || !profile || updateProfile.isPending
                      }
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      <span className="ml-2">Lưu hồ sơ</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
        <Card className={PROFILE_CARD_CLASS}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <KeyRound className="size-5 text-primary" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Đặt lại mật khẩu cho phiên đăng nhập quản trị. Mật khẩu mới cần
                từ 6 ký tự trở lên.
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
                  placeholder="Nhập mật khẩu hiện tại"
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
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
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
                  placeholder="Nhập lại mật khẩu mới"
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
  )
}

export default function AdminProfilePage() {
  return (
    <AdminPageGuard>
      <AdminProfilePageInner />
    </AdminPageGuard>
  )
}
