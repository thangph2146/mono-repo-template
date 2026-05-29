"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Calendar,
  Clock,
  MapPin,
  Globe,
} from "lucide-react"

const LocationMap = dynamic(
  () => import("@/components/location-map").then((m) => m.LocationMap),
  { ssr: false }
)
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
import { useLocationDetailQuery } from "../_component"
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

function LocationDetailInner() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const canUpdate = user
    ? canUserAccess(user, PERMISSION_CODES.LOCATIONS_UPDATE)
    : false

  const { data: entity, isLoading, isError } = useLocationDetailQuery(api, id)

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được địa điểm")
      router.push("/locations")
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
            onClick={() => router.push("/locations")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div className="flex flex-col">
            <TypographyH2 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
              {entity.name || "Địa điểm"}
            </TypographyH2>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Địa điểm</span>
            </p>
          </div>
        </div>
        {canUpdate && (
          <Button
            type="button"
            variant="default"
            onClick={() => router.push(`/locations/${id}/edit`)}
          >
            <Pencil className="size-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <Card className="border border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="size-5 text-primary" />
            Thông tin địa điểm
          </CardTitle>
          <CardDescription>
            Thông tin cơ bản của địa điểm.
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

          {entity.address && (
            <>
              <hr className="border-border/40" />
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  Địa chỉ
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 bg-muted/20 rounded-lg border border-border/40 p-3">
                  {entity.address}
                </p>
              </div>
            </>
          )}

          {entity.mapUrl && (
            <>
              <hr className="border-border/40" />
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="size-3.5" />
                  Bản đồ
                </p>
                <LocationMap
                  mapUrl={entity.mapUrl}
                  name={entity.name ?? undefined}
                  address={entity.address ?? undefined}
                />
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

export default function LocationDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <LocationDetailInner />
    </AdminPageGuard>
  )
}
