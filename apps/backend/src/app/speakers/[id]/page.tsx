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
  User,
  Briefcase,
  Building2,
  Mail,
  Phone,
  FileText,
} from "lucide-react"
import { PageSection } from "@ui/components/layout"
import { Badge } from "@ui/components/badge"
import { Button } from "@ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card"
import { AdminPageGuard } from "@/components/admin-page-guard"
import { api } from "@/lib/api"
import { useSpeakerDetailQuery } from "../_component"
import { TypographyH1, TypographyH2 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
} from "@ui/lib/layout-shell"

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Chưa ghi nhận";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa ghi nhận" : date.toLocaleString("vi-VN");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function SpeakerDetailInner() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: entity, isLoading, isError } = useSpeakerDetailQuery(api, id)

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được diễn giả")
      router.push("/speakers")
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
        <div className="w-full flex justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/speakers")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex flex-col">
            <TypographyH2 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
              {entity.name}
            </TypographyH2>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Diễn giả</span>
            </p>
          </div>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={() => router.push(`/speakers/${id}/edit`)}
          >
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/70 pt-0 shadow-sm">
            <div className="flex flex-col items-center bg-gradient-to-b from-primary/10 via-primary/5 to-background px-6 pt-8 pb-6 text-center">
              {entity.avatar ? (
                <img
                  src={entity.avatar}
                  alt={entity.name}
                  className="size-28 rounded-full border-4 border-background object-cover shadow-lg"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-full border-4 border-background bg-muted text-3xl font-bold text-muted-foreground shadow-lg">
                  {initials(entity.name)}
                </div>
              )}
              <TypographyH1 className="mt-4 text-xl leading-tight font-bold">
                {entity.name}
              </TypographyH1>
              {entity.title && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {entity.title}
                </p>
              )}
              {entity.organization && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Building2 className="size-3.5" />
                  {entity.organization}
                </div>
              )}
              <div className="mt-4">
                {entity.status === 1 ? (
                  <Badge variant="default" className="rounded-full px-4 py-1">
                    Hoạt động
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full px-4 py-1">
                    Khóa
                  </Badge>
                )}
              </div>
            </div>
            <CardContent className="space-y-4 pt-5">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Calendar className="size-3" />
                  Ngày tạo
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDateTime(entity.createdAt)}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <Clock className="size-3" />
                  Cập nhật
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDateTime(entity.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          {entity.bio && (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5 text-primary" />
                  Tiểu sử
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {entity.bio}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="size-5 text-primary" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                <div className="flex items-center gap-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="truncate text-sm font-medium">
                      {entity.email || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Phone className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="text-sm font-medium">{entity.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Briefcase className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Chức danh</p>
                    <p className="text-sm font-medium">{entity.title || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Tổ chức</p>
                    <p className="text-sm font-medium">
                      {entity.organization || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  )
}

export default function SpeakerDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <SpeakerDetailInner />
    </AdminPageGuard>
  )
}
