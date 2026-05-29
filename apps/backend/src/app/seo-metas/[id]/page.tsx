"use client";

import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft, Pencil, Search } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSION_CODES, canUserAccess } from "@workspace/api-client";
import { api } from "@/lib/api";
import { useSeoMetaDetailQuery } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function SeoMetaDetailInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.SEO_METAS_UPDATE) : false;

  const { data: detail, isLoading, isError } = useSeoMetaDetailQuery(api, id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <p className="text-destructive">Không tìm thấy SEO metadata.</p>
        <Button type="button" variant="outline" onClick={() => router.push("/seo-metas")}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="h-10 gap-2 rounded-lg" onClick={() => router.push("/seo-metas")}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              <Search className="inline size-6 mr-2" />
              SEO: {detail.page}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              Chi tiết SEO metadata cho trang &quot;{detail.page}&quot;
            </p>
          </div>
        </div>
        {canUpdate && (
          <Button type="button" onClick={() => router.push(`/seo-metas/${id}/edit`)}>
            <Pencil className="size-4" /> Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Đường dẫn</p>
              <p className="text-sm font-mono">{detail.page}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
              {detail.status === 1 ? (
                <Badge variant="default" className="text-[10px]">Hoạt động</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Tắt</Badge>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Title SEO</p>
              <p className="text-sm">{detail.title ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
              <p className="text-sm">{detail.description ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Từ khóa</p>
              <p className="text-sm">{detail.keywords ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Graph</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">OG Title</p>
              <p className="text-sm">{detail.ogTitle ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OG Mô tả</p>
              <p className="text-sm">{detail.ogDescription ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">OG Ảnh</p>
              {detail.ogImage ? (
                <div className="mt-1">
                  <img
                    src={detail.ogImage}
                    alt="OG Image"
                    className="max-h-32 rounded border object-cover"
                  />
                </div>
              ) : (
                <p className="text-sm">—</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thời gian</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tạo lúc</p>
            <p className="text-sm">{formatDateTime(detail.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Cập nhật lúc</p>
            <p className="text-sm">{formatDateTime(detail.updatedAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Xóa lúc</p>
            <p className="text-sm">{formatDateTime(detail.deletedAt)}</p>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  );
}

export default function SeoMetaDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <SeoMetaDetailInner />
    </AdminPageGuard>
  );
}
