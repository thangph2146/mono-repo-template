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
  Building2,
  Hash,
  Tag,
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
import { useAuth } from "@/providers/auth-provider"
import { PERMISSION_CODES, canUserAccess } from "@workspace/api-client"
import { api } from "@/lib/api"
import { useDepartmentDetailQuery } from "../_component"
import { TypographyH1, TypographyH2 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
} from "@ui/lib/layout-shell"

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN")
}

function DepartmentDetailInner() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const canUpdate = user
    ? canUserAccess(user, PERMISSION_CODES.DEPARTMENTS_UPDATE)
    : false

  const { data: entity, isLoading, isError } = useDepartmentDetailQuery(api, id)

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được phòng khoa")
      router.push("/departments")
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

  if (!entity) return null

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/departments")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex flex-col">
            <TypographyH2 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
              {entity.name || "Phòng khoa"}
            </TypographyH2>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Phòng khoa</span>
            </p>
          </div>
        </div>
        {canUpdate && (
          <Button
            type="button"
            variant="default"
            onClick={() => router.push(`/departments/${id}/edit`)}
          >
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" />
            Thông tin phòng khoa
          </CardTitle>
          <CardDescription>
            Thông tin cơ bản của phòng khoa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <TypographyH1 className="text-2xl font-bold">
              {entity.name || "—"}
            </TypographyH1>
            <div className="mt-2">
              {entity.status === 0 ? (
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

          {entity.code && (
            <>
              <hr className="border-border/40" />
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash className="size-3.5" />
                  Mã phòng khoa
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 rounded-lg border border-border/40 p-3 font-mono">
                  {entity.code}
                </p>
              </div>
            </>
          )}

          {entity.description && (
            <>
              <hr className="border-border/40" />
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag className="size-3.5" />
                  Mô tả
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 rounded-lg border border-border/40 p-3">
                  {entity.description}
                </p>
              </div>
            </>
          )}

          <hr className="border-dashed border-border/40" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Ngày tạo
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(entity.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Cập nhật
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(entity.updatedAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  )
}

export default function DepartmentDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <DepartmentDetailInner />
    </AdminPageGuard>
  )
}
