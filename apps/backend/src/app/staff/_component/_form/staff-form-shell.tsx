"use client"

import { useRef, useState } from "react"
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
  ShieldHalf,
  UserCircle,
  UserPlus,
  X,
} from "lucide-react"
import { Button } from "@ui/components/button"
import { Checkbox } from "@ui/components/checkbox"
import { FieldError } from "@ui/components/field"
import { FormFieldCol } from "@ui/components/typing"
import { Input } from "@ui/components/input"
import { Switch } from "@ui/components/switch"
import { TypographyH1, TypographyH3 } from "@ui/components/typography"
import {
  ADMIN_PAGE_TITLE_FORM_CLASS,
  ADMIN_PAGE_TITLE_ICON_SM_CLASS,
} from "@ui/lib/layout-shell"
import { Controller } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import type { StaffFormValues } from "../_hooks/use-staff-form"
import { readAdminSession } from "@/lib/auth-session"
import { toast } from "sonner"

export interface StaffFormShellProps {
  isEdit: boolean
  form: UseFormReturn<StaffFormValues>
  roles: Array<{ code: string; name: string }>
  onSubmit: () => Promise<void> | void
  onCancel: () => void
  submitting: boolean
}

export function StaffFormShell(props: StaffFormShellProps) {
  const { isEdit, form, roles, onSubmit, onCancel, submitting } = props

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const avatarValue = form.watch("avatar")

  const handleUploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folderPath", "avatars")
      const { DEFAULT_API_URL } = await import("@workspace/api-client")
      const baseUrl = (
        process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
      ).replace(/\/$/, "")
      const uid = readAdminSession()?.id
      const res = await fetch(`${baseUrl}/admin/uploads`, {
        method: "POST",
        headers: uid ? { "X-User-Id": String(uid) } : {},
        body: fd,
      })
      if (!res.ok) throw new Error("Upload thất bại")
      const json = (await res.json()) as { data?: { url?: string } }
      const url = json.data?.url
      if (!url) throw new Error("Không nhận được URL ảnh")
      form.setValue("avatar", url, { shouldDirty: true })
      toast.success("Đã tải ảnh đại diện")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi upload ảnh")
    } finally {
      setUploadingAvatar(false)
    }
  }

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  const roleChecklist = (
    <Controller
      name="roleCodes"
      control={form.control}
      render={({ field: { value, onChange }, fieldState }) => (
        <div className="space-y-2">
          <div className="max-h-[220px] space-y-3 overflow-y-auto rounded-lg border border-border p-3">
            {roles.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                Chưa tải được danh sách vai trò.
              </p>
            ) : (
              roles.map((r) => (
                <div
                  key={r.code}
                  className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/60"
                  onClick={() => {
                    const newValue = value.includes(r.code)
                      ? value.filter((c: string) => c !== r.code)
                      : [...value, r.code]
                    onChange(newValue)
                  }}
                >
                  <Checkbox
                    checked={value.includes(r.code)}
                    className="mt-0.5"
                  />
                  <ShieldHalf
                    className="mt-0.5 size-4 shrink-0 text-primary/70"
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-medium">{r.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {r.code}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </div>
      )}
    />
  )

  const formContent = (
    <>
      <div className="space-y-6 py-2">
        {/* Account Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <UserCircle className="size-4 text-primary" aria-hidden />
            <TypographyH3 className="text-sm font-semibold text-foreground">
              Thông tin tài khoản
            </TypographyH3>
          </div>
          <div className="flex items-start gap-4 pb-4">
            <div className="relative size-16 shrink-0">
              {avatarValue ? (
                <img
                  src={avatarValue}
                  alt=""
                  className="size-16 rounded-full border-2 border-border/60 object-cover shadow-sm"
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full border-2 border-border/60 bg-muted text-lg font-bold text-muted-foreground">
                  {initials(form.watch("fullName") || "?")}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent disabled:opacity-50"
                title="Tải ảnh đại diện"
              >
                <Camera className="size-3 text-muted-foreground" />
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
            <div className="min-w-0 flex-1">
              <Controller
                name="avatar"
                control={form.control}
                render={({ field }) => (
                  <FormFieldCol label="URL ảnh đại diện">
                    <Input
                      id="staff-avatar-url"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </FormFieldCol>
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {!isEdit && (
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldCol label="Email đăng nhập" required>
                    <Input
                      id="c-email"
                      type="email"
                      autoComplete="off"
                      placeholder="example@hub.edu.vn"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={fieldState.error ? "border-destructive" : ""}
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </FormFieldCol>
                )}
              />
            )}
            {isEdit && (
              <FormFieldCol label="Email">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      disabled
                      className="bg-muted/50 font-mono text-sm"
                    />
                  )}
                />
              </FormFieldCol>
            )}
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Họ và tên" required>
                  <Input
                    id={isEdit ? "e-name" : "c-name"}
                    placeholder="Nguyễn Văn A"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={fieldState.error ? "border-destructive" : ""}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </FormFieldCol>
              )}
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <FormFieldCol
                label={isEdit ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu ban đầu"}
                required={!isEdit}
              >
                <Input
                  id={isEdit ? "e-pw" : "c-pw"}
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    isEdit ? "Để trống = không đổi" : "Tối thiểu 6 ký tự"
                  }
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className={fieldState.error ? "border-destructive" : ""}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {isEdit
                    ? "Để trống nếu không muốn đổi mật khẩu"
                    : "Mật khẩu phải có tối thiểu 6 ký tự"}
                </p>
              </FormFieldCol>
            )}
          />

          <div className="space-y-4">
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 shrink-0 rounded-lg bg-background p-1.5 shadow-sm">
                      {field.value ? (
                        <CheckCircle2
                          className="size-4 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <Lock
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isEdit ? "Tài khoản hoạt động" : "Kích hoạt"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isEdit
                          ? "Khoá sẽ chặn đăng nhập"
                          : "Tắt để tạo tài khoản ở trạng thái khoá"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </div>
        </div>

        {/* Status & Roles Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Chọn vai trò{" "}
                {isEdit && (
                  <span className="text-muted-foreground">
                    (thay thế toàn bộ khi lưu)
                  </span>
                )}
              </p>
              {roleChecklist}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          className="gap-2 rounded-lg"
          onClick={onCancel}
        >
          <X className="size-4" aria-hidden />
          Huỷ
        </Button>
        <Button
          type="button"
          onClick={() => void onSubmit()}
          disabled={submitting}
          className="gap-2 rounded-lg font-bold"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
        </Button>
      </div>
    </>
  )

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại
        </Button>
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <UserPlus className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          {isEdit ? "Sửa nhân sự" : "Thêm nhân sự mới"}
        </TypographyH1>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        {formContent}
      </div>
    </>
  )
}
