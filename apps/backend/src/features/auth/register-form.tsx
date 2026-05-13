"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailPlus, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@ui/components/field";
import { Input } from "@ui/components/input";
import { PointerHighlight } from "@ui/components/pointer-highlight";
import { toast } from "sonner";
import { AUTH_LOGIN_PATH } from "@/lib/auth-routes";
import { registerAccount } from "./auth-api";

type RegisterFormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_STATE: RegisterFormState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField<Key extends keyof RegisterFormState>(
    key: Key,
    value: RegisterFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      await registerAccount({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setForm(INITIAL_STATE);
      toast.success("Đăng ký thành công. Tài khoản của bạn đã được tạo với vai trò Phụ huynh.");
      router.replace(AUTH_LOGIN_PATH);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể đăng ký tài khoản. Vui lòng thử lại.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-5xl">
        <Card className="w-full overflow-hidden rounded-lg border p-0 shadow-sm">
          <CardContent className="grid grid-cols-1 p-0 md:grid-cols-2">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 lg:p-10">
              <FieldGroup className="gap-4">
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <h2 className="text-2xl font-bold text-secondary sm:text-xl md:text-3xl lg:text-3xl">
                    Đăng ký hệ thống
                  </h2>
                  <div className="flex flex-col items-center gap-1">
                    <PointerHighlight>
                      <p className="relative z-10 text-xl font-bold uppercase tracking-tight text-primary sm:text-sm md:text-2xl">
                        Hệ thống Kết nối Phụ huynh
                      </p>
                    </PointerHighlight>
                    <p className="text-xs font-medium italic text-muted-foreground sm:text-sm md:text-sm">
                      "Nắm bắt hành trình của con, an tâm tương lai vững chắc"
                    </p>
                  </div>
                </div>

                <Field>
                  <FieldLabel htmlFor="fullName" className="font-medium text-primary">
                    Họ và tên
                  </FieldLabel>
                  <Input
                    id="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="Họ và tên"
                    required
                    disabled={submitting}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email" className="font-medium text-primary">
                    Email
                  </FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="example@email.com"
                    required
                    disabled={submitting}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone" className="font-medium text-primary">
                    Số điện thoại
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="phone"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder="Nhập số điện thoại của bạn"
                      disabled={submitting}
                      className="pr-10"
                    />
                    <div className="pointer-events-none absolute right-0 top-0 flex h-full items-center px-3">
                      <Smartphone className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password" className="font-medium text-primary">
                    Mật khẩu
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      placeholder="Tạo mật khẩu"
                      required
                      disabled={submitting}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={submitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword" className="font-medium text-primary">
                    Xác nhận mật khẩu
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      placeholder="Xác nhận mật khẩu của bạn"
                      required
                      disabled={submitting}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      disabled={submitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </Field>

                <Field>
                  <Button
                    type="submit"
                    className="min-h-[44px] w-full bg-destructive px-8 text-destructive-foreground hover:bg-destructive/90"
                    disabled={submitting}
                  >
                    <MailPlus className="size-4" />
                    <span className="text-base font-bold">
                      {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
                    </span>
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Hoặc tiếp tục với
                </FieldSeparator>

                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] w-full border-secondary/30 hover:bg-secondary/10"
                    onClick={() =>
                      toast.info("Đăng ký Google cho hệ thống phụ huynh chưa được cấu hình.")
                    }
                  >
                    <span className="text-xl font-bold text-secondary">G</span>
                    <span className="text-base font-bold text-secondary">
                      Đăng ký bằng Google
                    </span>
                  </Button>
                </Field>

                <FieldError>{error}</FieldError>

                <FieldDescription className="text-center text-sm md:text-base">
                  Đã có tài khoản?{" "}
                  <Link
                    href={AUTH_LOGIN_PATH}
                    prefetch={false}
                    className="font-bold text-primary transition-colors hover:text-primary/80"
                  >
                    Đăng nhập
                  </Link>
                </FieldDescription>
              </FieldGroup>
            </form>

            <div className="relative hidden bg-muted text-foreground md:flex">
              <img
                src="https://hub.edu.vn/DATA/IMAGES/2025/06/06/20250606095214z6676928339374_824596735893cad9e9d4402075fcccd2.jpg"
                alt="Hình ảnh HUB"
                title="Hình ảnh HUB"
                loading="eager"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.85]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
