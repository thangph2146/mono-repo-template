import { MessageSquare, Save, User, X, Loader2, FileText } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Switch } from "@ui/components/switch";
import { FieldError } from "@ui/components/field";
import { FormFieldCol } from "@ui/components/typing";
import { ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1, TypographyH3 } from "@ui/components/typography";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { ContactFormData } from "../_hooks/use-contact-form";

interface ContactFormShellProps {
  mode: "create" | "edit";
  form: UseFormReturn<ContactFormData>;
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  submitting: boolean;
}

export function ContactFormShell(props: ContactFormShellProps) {
  const { mode, form, onSubmit, onCancel, submitting } = props;

  const formContent = (
    <>
      <div className="space-y-8 py-2">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <User className="size-4 text-primary" aria-hidden />
            </div>
            <TypographyH3 className="text-sm font-semibold text-foreground">Thông tin liên hệ</TypographyH3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Họ và tên" required>
                  <Input
                    id="c-name"
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
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Email" required>
                  <Input
                    id="c-email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@hub.edu.vn"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={fieldState.error ? "border-destructive" : ""}
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Sẽ được dùng để gửi phản hồi
                  </p>
                </FormFieldCol>
              )}
            />
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Số điện thoại">
                  <Input
                    id="c-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0123456789"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={fieldState.error ? "border-destructive" : ""}
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Để lại trống nếu không muốn cung cấp
                  </p>
                </FormFieldCol>
              )}
            />
          </div>
        </div>

        {/* Message Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <MessageSquare className="size-4 text-primary" aria-hidden />
            </div>
            <TypographyH3 className="text-sm font-semibold text-foreground">Nội dung yêu cầu</TypographyH3>
          </div>
          <div className="grid gap-4">
            <Controller
              name="subject"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Tiêu đề" required>
                  <Input
                    id="c-subject"
                    placeholder="Tiêu đề ngắn gọn cho yêu cầu"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className={fieldState.error ? "border-destructive" : ""}
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                </FormFieldCol>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldCol label="Địa chỉ">
                    <Input
                      id="c-address"
                      placeholder="Địa chỉ của bạn"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={fieldState.error ? "border-destructive" : ""}
                    />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </FormFieldCol>
                )}
              />
              <Controller
                name="program"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldCol label="Chương trình">
                    <Input
                      id="c-program"
                      placeholder="Chương trình đào tạo"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={fieldState.error ? "border-destructive" : ""}
                    />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </FormFieldCol>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="major"
                control={form.control}
                render={({ field, fieldState }) => (
                  <FormFieldCol label="Ngành">
                    <Input
                      id="c-major"
                      placeholder="Ngành học"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      className={fieldState.error ? "border-destructive" : ""}
                    />
                    {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  </FormFieldCol>
                )}
              />
              <Controller
                name="receiveInfo"
                control={form.control}
                render={({ field }) => (
                  <FormFieldCol label="Đăng ký nhận thông tin tuyển sinh">
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        id="c-receive-info"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  </FormFieldCol>
                )}
              />
            </div>
            <Controller
              name="requestConsultation"
              control={form.control}
              render={({ field }) => (
                <FormFieldCol label="Đăng ký tư vấn">
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      id="c-request-consultation"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormFieldCol>
              )}
            />
            <Controller
              name="message"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormFieldCol label="Nội dung chi tiết">
                  <Textarea
                    id="c-message"
                    placeholder="Mô tả chi tiết yêu cầu hoặc câu hỏi của bạn..."
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    rows={6}
                    className={fieldState.error ? "border-destructive" : "resize-none"}
                  />
                  {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
                  <p className="text-xs text-muted-foreground mt-1">
                    Cung cấp càng nhiều chi tiết càng tốt để chúng tôi hỗ trợ nhanh chóng
                  </p>
                </FormFieldCol>
              )}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="outline" className="gap-2 rounded-lg" onClick={onCancel}>
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
          {mode === "edit" ? "Lưu thay đổi" : "Gửi yêu cầu"}
        </Button>
      </div>
    </>
  );

  return (
    <>
      <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
        <FileText className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
        {mode === "edit" ? "Sửa yêu cầu liên hệ" : "Thêm yêu cầu liên hệ mới"}
      </TypographyH1>
      <div className="rounded-lg border border-border bg-card p-6">{formContent}</div>
    </>
  );
}
