"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
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
import { useSpeakerDetailQuery } from "../_component"
import { TypographyH1, TypographyH2 } from "@ui/components/typography"
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
} from "@ui/lib/layout-shell"

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Chưa ghi nhận"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "Chưa ghi nhận"
    : date.toLocaleString("vi-VN")
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
  const { user } = useAuth()
  const canUpdate = user
    ? canUserAccess(user, PERMISSION_CODES.SPEAKERS_UPDATE)
    : false

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
        <div className="flex w-full justify-between gap-3">
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
          {canUpdate && (
            <Button
              type="button"
              variant="default"
              onClick={() => router.push(`/speakers/${id}/edit`)}
            >
              <Pencil className="size-4" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-primary" />
            Thông tin diễn giả
          </CardTitle>
          <CardDescription>Thông tin cơ bản của diễn giả.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="relative aspect-[3/4] w-40 shrink-0 sm:w-60">
              {entity.avatar ? (
                <Image
                  src={entity.avatar}
                  alt={entity.name}
                  fill
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 240px, (max-width: 1280px) 320px, (max-width: 1536px) 400px, 480px"
                  unoptimized
                  className="rounded-lg border-2 border-border/60 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-border/60 bg-muted text-3xl font-bold text-muted-foreground shadow-sm">
                  {initials(entity.name)}
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-4">
              <div>
                <TypographyH1 className="text-2xl font-bold">
                  {entity.name}
                </TypographyH1>
                <div className="mt-2">
                  {entity.status === 1 ? (
                    <Badge
                      variant="default"
                      className="rounded-full px-3 py-0.5 shadow-sm"
                    >
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full px-3 py-0.5"
                    >
                      Khóa
                    </Badge>
                  )}
                </div>
              </div>

              <hr className="border-border/40" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5" />
                    Email
                  </p>
                  <p className="text-sm font-medium">{entity.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />
                    Số điện thoại
                  </p>
                  <p className="text-sm font-medium">{entity.phone || "—"}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="size-3.5" />
                    Chức danh
                  </p>
                  <p className="text-sm font-medium">{entity.title || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" />
                    Tổ chức
                  </p>
                  <p className="text-sm font-medium">
                    {entity.organization || "—"}
                  </p>
                </div>
              </div>

              {entity.bio && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="size-3.5" />
                    Tiểu sử
                  </p>
                  <p className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {entity.bio}
                  </p>
                </div>
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
            </div>
          </div>
        </CardContent>
      </Card>
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
