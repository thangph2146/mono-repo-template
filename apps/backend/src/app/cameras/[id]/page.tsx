"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Calendar,
  Clock,
  Camera,
  Monitor,
  User,
  Cable,
  Fingerprint,
} from "lucide-react"
import { PageSection } from "@ui/components/layout"
import { Badge } from "@ui/components/badge"
import { Button } from "@ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card"
import { AdminPageGuard } from "@/components/admin-page-guard"
import { api } from "@/lib/api"
import { useCameraDetailQuery } from "../_component"
import { TypographyH1, TypographyH2 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
} from "@ui/lib/layout-shell"
import { useAuth } from "@/providers/auth-provider"
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client"

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN")
}

function DetailInner() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const canUpdate = user
    ? canUserAccess(user, PERMISSION_CODES.CAMERAS_UPDATE)
    : false

  const { data: e, isLoading, isError } = useCameraDetailQuery(api, id)

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được camera")
      router.push("/cameras")
    }
  }, [isError, router])

  if (isLoading) {
    return (
      <PageSection
        max="full"
        className="flex min-w-0 items-center justify-center py-24"
      >
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    )
  }

  if (!e) return null

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/cameras")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex flex-col">
            <TypographyH2 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
              {e.name || "Camera"}
            </TypographyH2>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Camera</span>
            </p>
          </div>
        </div>
        {canUpdate && (
          <Button
            type="button"
            variant="default"
            onClick={() => router.push(`/cameras/${id}/edit`)}
          >
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="size-5 text-primary" />
            Thông tin camera
          </CardTitle>
          <CardDescription>
            Thông tin kết nối và cấu hình camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <TypographyH1 className="text-2xl font-bold">
              {e.name || "—"}
            </TypographyH1>
            <div className="mt-2">
              {e.status === 0 ? (
                <Badge variant="outline" className="rounded-full px-3 py-0.5">
                  Khóa
                </Badge>
              ) : (
                <Badge
                  variant="default"
                  className="rounded-full px-3 py-0.5 shadow-sm"
                >
                  Hoạt động
                </Badge>
              )}
            </div>
          </div>

          {(e.code || e.ipAddress) && (
            <>
              <hr className="border-border/40" />
              <div className="grid gap-5 sm:grid-cols-2">
                {e.code && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Fingerprint className="size-3.5" />
                      Mã camera
                    </p>
                    <p className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-sm text-foreground/90">
                      {e.code}
                    </p>
                  </div>
                )}
                {e.ipAddress && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Cable className="size-3.5" />
                      Địa chỉ IP
                    </p>
                    <p className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-sm text-foreground/90">
                      {e.ipAddress}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <hr className="border-border/40" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Monitor className="size-3.5" />
                Cổng
              </p>
              <p className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-sm text-foreground/90">
                {e.port || "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3.5" />
                Tên đăng nhập
              </p>

              <p className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-sm text-foreground/90">
                {e.username || "—"}
              </p>
            </div>
          </div>

          <hr className="border-dashed border-border/40" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Ngày tạo
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(e.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Cập nhật
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(e.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  )
}

export default function CameraDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <DetailInner />
    </AdminPageGuard>
  )
}
