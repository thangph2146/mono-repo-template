import { ShieldHalf, CheckCircle2, Lock, UserCircle, X, Save, Loader2, UserPlus } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { FieldError } from "@ui/components/field";
import { FormFieldCol } from "@ui/components/typing";
import { Switch } from "@ui/components/switch";
import { Checkbox } from "@ui/components/checkbox";
import { ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1, TypographyH3 } from "@ui/components/typography";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { StaffFormValues } from "../_hooks/use-staff-form";

interface StaffFormShellProps {
  isEdit: boolean;
  form: UseFormReturn<StaffFormValues>;
  roles: Array<{ code: string; name: string }>;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  submitting: boolean;
}

export function StaffFormShell(props: StaffFormShellProps) {
  const {
    isEdit,
    form,
    roles,
    onSubmit,
    onCancel,
    submitting,
  } = props;

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
                      : [...value, r.code];
                    onChange(newValue);
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
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </div>
      )}
    />
  );

  const formContent = (
    <>
      <div className="space-y-6 py-2">
        {/* Account Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2">
            <UserCircle className="size-4 text-primary" aria-hidden />
            <TypographyH3 className="text-sm font-semibold text-foreground">Thông tin tài khoản</TypographyH3>
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
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
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
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
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
              <FormFieldCol label={isEdit ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu ban đầu"} required={!isEdit}>
                <Input
                  id={isEdit ? "e-pw" : "c-pw"}
                  type="password"
                  autoComplete="new-password"
                  placeholder={isEdit ? "Để trống = không đổi" : "Tối thiểu 6 ký tự"}
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  className={fieldState.error ? "border-destructive" : ""}
                />
                {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                <p className="text-xs text-muted-foreground">
                  {isEdit ? "Để trống nếu không muốn đổi mật khẩu" : "Mật khẩu phải có tối thiểu 6 ký tự"}
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
                        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                      ) : (
                        <Lock className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isEdit ? "Tài khoản hoạt động" : "Kích hoạt"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isEdit ? "Khoá sẽ chặn đăng nhập" : "Tắt để tạo tài khoản ở trạng thái khoá"}
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
                Chọn vai trò {isEdit && <span className="text-muted-foreground">(thay thế toàn bộ khi lưu)</span>}
              </p>
              {roleChecklist}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
  );


  return (
    <>
      <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
        <UserPlus className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
        {isEdit ? "Sửa nhân sự" : "Thêm nhân sự mới"}
      </TypographyH1>
      <div className="rounded-lg border border-border bg-card p-6">
        {formContent}
      </div>
    </>
  );
}
