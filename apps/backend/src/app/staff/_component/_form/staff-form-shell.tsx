import { ShieldHalf, CheckCircle2, Lock, Mail, UserCircle, KeyRound, X, Save, Loader2, UserPlus } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Checkbox } from "@ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@ui/components/dialog";
import { ADMIN_DIALOG_CONTENT_MD_CLASS, ADMIN_DIALOG_CONTENT_LG_CLASS } from "@ui/lib/layout-shell";

interface StaffFormShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  formEmail: string;
  formFullName: string;
  formPassword: string;
  formActive: boolean;
  formRoles: string[];
  roles: Array<{ code: string; name: string }>;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
  onRoleToggle: (code: string, checked: boolean) => void;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  submitting: boolean;
}

export function StaffFormShell(props: StaffFormShellProps) {
  const {
    open,
    onOpenChange,
    isEdit,
    formEmail,
    formFullName,
    formPassword,
    formActive,
    formRoles,
    roles,
    onEmailChange,
    onFullNameChange,
    onPasswordChange,
    onActiveChange,
    onRoleToggle,
    onSubmit,
    onCancel,
    submitting,
  } = props;

  const roleChecklist = (
    <div className="max-h-[220px] space-y-3 overflow-y-auto rounded-lg border border-border p-3">
      {roles.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          Chưa tải được danh sách vai trò.
        </p>
      ) : (
        roles.map((r) => (
          <label
            key={r.code}
            className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/60"
          >
            <Checkbox
              checked={formRoles.includes(r.code)}
              onCheckedChange={(v) => onRoleToggle(r.code, v === true)}
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
          </label>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isEdit ? ADMIN_DIALOG_CONTENT_LG_CLASS : ADMIN_DIALOG_CONTENT_MD_CLASS}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold">
            {isEdit ? (
              <>
                <UserPlus className="size-7 shrink-0 text-primary" aria-hidden />
                Sửa nhân sự
              </>
            ) : (
              <>
                <UserPlus className="size-7 shrink-0 text-primary" aria-hidden />
                Thêm nhân sự
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Email cố định. Có thể đặt lại mật khẩu (để trống nếu giữ nguyên)."
              : "Tạo tài khoản mới và gán một hoặc nhiều vai trò. Có thể chỉnh sửa sau."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="c-email" className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground" aria-hidden />
                Email đăng nhập
              </Label>
              <Input
                id="c-email"
                type="email"
                autoComplete="off"
                value={formEmail}
                onChange={(e) => onEmailChange(e.target.value)}
              />
            </div>
          )}
          {isEdit && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="size-3.5 text-muted-foreground" aria-hidden />
                Email
              </Label>
              <Input
                value={formEmail}
                disabled
                className="bg-muted/50 font-mono text-sm"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "e-name" : "c-name"} className="flex items-center gap-2">
              <UserCircle className="size-3.5 text-muted-foreground" aria-hidden />
              Họ và tên
            </Label>
            <Input
              id={isEdit ? "e-name" : "c-name"}
              value={formFullName}
              onChange={(e) => onFullNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={isEdit ? "e-pw" : "c-pw"} className="flex items-center gap-2">
              <KeyRound className="size-3.5 text-muted-foreground" aria-hidden />
              {isEdit ? "Mật khẩu mới (tuỳ chọn)" : "Mật khẩu ban đầu"}
            </Label>
            <Input
              id={isEdit ? "e-pw" : "c-pw"}
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? "Để trống = không đổi" : ""}
              value={formPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-lg bg-muted p-1.5">
                {formActive ? (
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
            <Switch checked={formActive} onCheckedChange={onActiveChange} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ShieldHalf className="size-3.5 text-muted-foreground" aria-hidden />
              Vai trò {isEdit && "(thay thế toàn bộ khi lưu)"}
            </Label>
            {roleChecklist}
          </div>
        </div>
        <DialogFooter className="gap-2">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
