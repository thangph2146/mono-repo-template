"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { canAccessStaffAdmin, type AuthUser } from "@workspace/api-client"
import { Button } from "@ui/components/button"
import { Card, CardContent } from "@ui/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@ui/components/field"
import { Input } from "@ui/components/input"
import { PointerHighlight } from "@ui/components/pointer-highlight"
import { TypographyH2 } from "@ui/components/typography"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select"
import { useAuth, useClientReady } from "@/providers/auth-provider"
import {
  fetchDevLoginOptions,
  type DevLoginOption,
} from "@/features/auth/auth-api"
import { AUTH_LOGIN_PATH, AUTH_REGISTER_PATH } from "@/lib/auth-routes"
import { ADMIN_SESSION_EVENT, writeAdminSession } from "@/lib/auth-session"

function decodeBridgeSession(raw: string): AuthUser | null {
  try {
    const binary = window.atob(raw)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const user = JSON.parse(json) as AuthUser

    if (
      typeof user?.id !== "string" ||
      typeof user?.email !== "string" ||
      !(
        typeof user?.name === "string" ||
        user?.name === null ||
        user?.name === undefined
      ) ||
      !Array.isArray(user?.roles) ||
      !Array.isArray(user?.permissions)
    ) {
      return null
    }

    return user
  } catch {
    return null
  }
}

export function SignInForm() {
  const router = useRouter()
  const { login, loginDevelopment } = useAuth()
  const clientReady = useClientReady()
  const isDevelopment = process.env.NODE_ENV === "development"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [devLoginOptions, setDevLoginOptions] = useState<DevLoginOption[]>([])
  const [selectedDevLoginId, setSelectedDevLoginId] = useState("")
  const [devLoginOptionsLoading, setDevLoginOptionsLoading] = useState(false)
  const staffOnlyToastRef = useRef(false)
  const bridgeHandledRef = useRef(false)

  useEffect(() => {
    if (!clientReady || bridgeHandledRef.current) return
    if (typeof window === "undefined") return

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash)
    const encodedSession = params.get("session")
    if (!encodedSession) return

    bridgeHandledRef.current = true
    const user = decodeBridgeSession(encodedSession)

    if (!user || !canAccessStaffAdmin(user)) {
      toast.error("Không thể đồng bộ phiên đăng nhập quản trị.")
      router.replace(AUTH_LOGIN_PATH)
      return
    }

    writeAdminSession(user)
    window.dispatchEvent(new Event(ADMIN_SESSION_EVENT))
    toast.success("Đã chuyển sang cổng quản trị.")
    router.replace("/")
  }, [clientReady, router])

  useEffect(() => {
    if (!clientReady || staffOnlyToastRef.current) return
    if (typeof window === "undefined") return
    const q = new URLSearchParams(window.location.search)
    if (q.get("reason") !== "staff_only") return
    staffOnlyToastRef.current = true
    toast.error(
      "Tài khoản phụ huynh không dùng được cổng quản trị nội bộ. Hãy đăng nhập ở cổng phụ huynh HUB Parent."
    )
    router.replace(AUTH_LOGIN_PATH)
  }, [clientReady, router])

  useEffect(() => {
    if (!clientReady || !isDevelopment) return

    let cancelled = false
    setDevLoginOptionsLoading(true)

    void fetchDevLoginOptions()
      .then((options) => {
        if (cancelled) return
        setDevLoginOptions(options)
      })
      .finally(() => {
        if (cancelled) return
        setDevLoginOptionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [clientReady, isDevelopment])

  const onSelectDevLogin = (value: string | null) => {
    const nextValue = value ?? ""
    setSelectedDevLoginId(nextValue)
    if (!nextValue) return
    const picked = devLoginOptions.find((option) => option.id === nextValue)
    if (!picked) return
    setEmail(picked.email)
    setPassword("")
    setError(null)
  }

  const runLogin = async (nextEmail: string, nextPassword: string) => {
    setError(null)
    setBusy(true)
    try {
      const result = await login(nextEmail, nextPassword)
      if (result === "invalid_credentials") {
        const message = "Sai email hoặc mật khẩu."
        setError(message)
        toast.error(message)
        return
      }
      if (result === "staff_only") {
        const message =
          "Tài khoản này chỉ dùng cho phụ huynh. Cổng quản trị cần tài khoản nội bộ của nhà trường."
        setError(message)
        toast.error(message)
        return
      }
      toast.success("Đăng nhập thành công.")
      router.replace("/")
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isDevelopment && selectedDevLoginId) {
      setError(null)
      setBusy(true)
      try {
        const result = await loginDevelopment(selectedDevLoginId)
        if (result === "invalid_credentials") {
          const message =
            "Không thể đăng nhập bằng tài khoản development đã chọn."
          setError(message)
          toast.error(message)
          return
        }
        if (result === "staff_only") {
          const message =
            "Tài khoản development này không có quyền dùng cổng quản trị."
          setError(message)
          toast.error(message)
          return
        }
        toast.success("Đăng nhập development thành công.")
        router.replace("/")
      } finally {
        setBusy(false)
      }
      return
    }
    await runLogin(email, password)
  }

  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-5xl">
        <div className="flex flex-col gap-4">
          <Card className="w-full overflow-hidden rounded-lg border p-0 shadow-sm">
            <CardContent className="grid grid-cols-1 p-0 md:grid-cols-2">
              <form onSubmit={onSubmit} className="p-6 md:p-8 lg:p-10">
                <FieldGroup className="gap-4">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <TypographyH2 className="text-2xl font-bold text-secondary sm:text-xl md:text-3xl lg:text-3xl">
                      Đăng nhập hệ thống
                    </TypographyH2>
                    <div className="flex flex-col items-center gap-1">
                      <PointerHighlight>
                        <p className="relative z-10 text-lg font-bold tracking-tight text-primary uppercase sm:text-sm md:text-xl xl:text-2xl">
                          Hệ thống Kết nối Phụ huynh
                        </p>
                      </PointerHighlight>
                      <p className="text-sm font-medium text-muted-foreground italic md:text-base">
                        &quot;Tâm an lòng, con vững bước - Đồng hành cùng tương
                        lai con tại HUB&quot;
                      </p>
                    </div>
                  </div>

                  <Field>
                    {isDevelopment ? (
                      <>
                        <FieldLabel className="font-medium text-primary">
                          Tài khoản development
                        </FieldLabel>
                        <Select
                          value={selectedDevLoginId}
                          onValueChange={onSelectDevLogin}
                          disabled={busy || devLoginOptionsLoading}
                        >
                          <SelectTrigger className="h-11 w-full rounded-lg">
                            <SelectValue
                              placeholder={
                                devLoginOptionsLoading
                                  ? "Đang tải user từ database..."
                                  : "Chọn tài khoản có sẵn trong database"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {devLoginOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name?.trim() || option.email}
                                <span className="text-xs text-muted-foreground">
                                  {option.email} | {option.description}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Danh sách chỉ hiện ở môi trường development. Khi chọn
                          sẽ đăng nhập trực tiếp theo user trong database, không
                          cần điều chỉnh hay biết mật khẩu.
                        </FieldDescription>
                      </>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel
                      htmlFor="email"
                      className="font-medium text-primary"
                    >
                      Email
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(event) => {
                        if (selectedDevLoginId) {
                          setSelectedDevLoginId("")
                        }
                        setEmail(event.target.value)
                      }}
                      required
                      disabled={busy}
                      placeholder="example@email.com"
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel
                        htmlFor="password"
                        className="font-medium text-primary"
                      >
                        Mật khẩu
                      </FieldLabel>
                      <Link
                        href={AUTH_REGISTER_PATH}
                        className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          if (selectedDevLoginId) {
                            setSelectedDevLoginId("")
                          }
                          setPassword(event.target.value)
                        }}
                        required={!isDevelopment || !selectedDevLoginId}
                        disabled={
                          busy || (isDevelopment && !!selectedDevLoginId)
                        }
                        placeholder={
                          isDevelopment && selectedDevLoginId
                            ? "Đã bỏ qua mật khẩu cho tài khoản development đã chọn"
                            : "Nhập mật khẩu của bạn"
                        }
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword((value) => !value)}
                        disabled={busy}
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
                    <Button
                      type="submit"
                      className="min-h-[44px] w-full bg-destructive px-8 text-destructive-foreground hover:bg-destructive/90"
                      disabled={busy}
                    >
                      <span className="text-base font-bold">
                        {busy
                          ? isDevelopment && selectedDevLoginId
                            ? "Đang đăng nhập development..."
                            : "Đang đăng nhập..."
                          : "Đăng nhập"}
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
                        toast.info(
                          "Đăng nhập Google cho cổng quản trị chưa được cấu hình."
                        )
                      }
                    >
                      <span className="text-xl font-bold text-secondary">
                        G
                      </span>
                      <span className="text-base font-bold text-secondary">
                        Đăng nhập bằng Google
                      </span>
                    </Button>
                  </Field>

                  <FieldError>{error}</FieldError>

                  <FieldDescription className="text-center text-sm md:text-base">
                    Nếu bạn chưa có tài khoản?{" "}
                    <Link
                      href={AUTH_REGISTER_PATH}
                      className="font-bold text-primary transition-colors hover:text-primary/80"
                    >
                      Đăng ký
                    </Link>
                  </FieldDescription>
                </FieldGroup>
              </form>

              <div className="relative hidden bg-muted text-foreground md:flex">
                <img
                  src="https://hub.edu.vn/DATA/IMAGES/2024/12/31/20241231235033-1vehub.jpg"
                  alt="Hình ảnh HUB"
                  title="Hình ảnh HUB"
                  loading="eager"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
