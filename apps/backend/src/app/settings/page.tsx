"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save, Settings2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card"
import { Input } from "@ui/components/input"
import { Label } from "@ui/components/label"
import { PageSection } from "@ui/components/layout"
import { AdminPageGuard } from "@/components/admin-page-guard"
import {
  TypographyH1,
  TypographyPLargeMuted,
  TypographyPSmallMuted,
} from "@ui/components/typography"
import {
  canUserAccess,
  isSuperAdminRoleCode,
  PERMISSION_CODES,
} from "@workspace/api-client"
import { api } from "@/lib/api"
import { useAuth } from "@/providers/auth-provider"
import {
  ADMIN_PAGE_FORM_COLUMN_CLASS,
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell"

function normalizePagedRoles(payload: unknown): {
  items: { id: string; code: string; name: string }[]
} {
  const envelope =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {}
  const raw = envelope.data
  if (!Array.isArray(raw)) return { items: [] }
  const items = raw
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r != null)
    .map((r) => ({
      id: String(r.id ?? ""),
      code: String(r.name ?? ""),
      name: String(r.displayName ?? r.name ?? ""),
    }))
    .filter((r) => !isSuperAdminRoleCode(r.code))
  return { items }
}

/** Giá trị settings từ API bị JSON double-encode (do MikroORM type:json).
 *  Parse thêm một lần để lấy chuỗi gốc. */
export function extractSettingValue(
  res: unknown,
  fallback: string
): string {
  const envelope = res as { data?: { value?: unknown }; value?: unknown }
  const raw = envelope.data?.value ?? envelope.value
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return typeof parsed === "string" ? parsed : raw
    } catch {
      return raw
    }
  }
  return fallback
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { user: session } = useAuth()
  const canManage = session != null && canUserAccess(session, PERMISSION_CODES.SETTINGS_MANAGE)

  const siteNameQuery = useQuery({
    queryKey: ["settings", "site_name"],
    queryFn: async (): Promise<string> => {
      return extractSettingValue(await api.http.get("/admin/settings/site_name"), "HUB Parent")
    },
    enabled: Boolean(session),
  })

  const siteDescQuery = useQuery({
    queryKey: ["settings", "site_description"],
    queryFn: async (): Promise<string> => {
      return extractSettingValue(await api.http.get("/admin/settings/site_description"), "Quản trị hệ thống")
    },
    enabled: Boolean(session),
  })

  const defaultRoleQuery = useQuery({
    queryKey: ["settings", "default_new_user_role"],
    queryFn: async (): Promise<string> => {
      return extractSettingValue(await api.http.get("/admin/settings/default_new_user_role"), "parent")
    },
    enabled: Boolean(session),
  })

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles-options"],
    queryFn: async () =>
      normalizePagedRoles(await api.http.get("/admin/roles", { query: { page: 1, limit: 200, status: "active" } })),
    enabled: Boolean(session),
  })

  const [siteName, setSiteName] = useState("")
  const [siteDesc, setSiteDesc] = useState("")
  const [defaultRole, setDefaultRole] = useState("")

  useEffect(() => {
    if (!siteNameQuery.data || !siteDescQuery.data || !defaultRoleQuery.data) return
    setSiteName((prev) => (prev === "" ? siteNameQuery.data : prev))
    setSiteDesc((prev) => (prev === "" ? siteDescQuery.data : prev))
    setDefaultRole((prev) => (prev === "" ? defaultRoleQuery.data : prev))
  }, [siteNameQuery.data, siteDescQuery.data, defaultRoleQuery.data])

  const dirty =
    siteName !== siteNameQuery.data ||
    siteDesc !== siteDescQuery.data ||
    defaultRole !== defaultRoleQuery.data

  const saveMutation = useMutation({
    mutationFn: async () =>
      api.http.put("/admin/settings", {
        site_name: siteName,
        site_description: siteDesc,
        default_new_user_role: defaultRole,
      }),
    onSuccess: () => {
      toast.success("Đã lưu cài đặt hệ thống")
      void Promise.all([
        siteNameQuery.refetch(),
        siteDescQuery.refetch(),
        defaultRoleQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["settings", "site-config"] }),
      ])
    },
    onError: () => toast.error("Không lưu được cài đặt"),
  })

  if (!session) return null

  if (!canManage) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <Settings2 className="size-5" />
          Cài đặt hệ thống
        </TypographyH1>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
            <CardDescription>Cần quyền {PERMISSION_CODES.SETTINGS_MANAGE}.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <PageSection max="full" className="min-w-0 space-y-6">
        <div>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            <Settings2 className={ADMIN_PAGE_TITLE_ICON_CLASS} />
            Cài đặt hệ thống
          </TypographyH1>
          <TypographyPLargeMuted className={ADMIN_PAGE_SUBTITLE_CLASS}>
            Quản lý thông tin thương hiệu và cấu hình chung.
          </TypographyPLargeMuted>
        </div>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              Thương hiệu
            </CardTitle>
            <CardDescription>
              Tên hiển thị trên thanh sidebar và tiêu đề trang quản trị.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-name">Tên ứng dụng</Label>
              <Input
                id="site-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="HUB Parent"
              />
              <TypographyPSmallMuted>
                Hiển thị trên sidebar (ví dụ: &ldquo;HUB Parent&rdquo;).
              </TypographyPSmallMuted>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-desc">Mô tả ngắn</Label>
              <Input
                id="site-desc"
                value={siteDesc}
                onChange={(e) => setSiteDesc(e.target.value)}
                placeholder="Quản trị hệ thống"
              />
              <TypographyPSmallMuted>
                Dòng phụ dưới tên ứng dụng trên sidebar.
              </TypographyPSmallMuted>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              Vai trò mặc định
            </CardTitle>
            <CardDescription>
              Role gán cho tài khoản mới đăng nhập lần đầu (kể cả Google).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="default-role">Role mặc định</Label>
              <select
                id="default-role"
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
              >
                {rolesQuery.data?.items.map((role) => (
                  <option key={role.id} value={role.code}>
                    {role.name}
                  </option>
                )) ?? null}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
            className="min-w-[8rem] rounded-lg"
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </PageSection>
    </AdminPageGuard>
  )
}
