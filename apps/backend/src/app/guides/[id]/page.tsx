"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Calendar,
  Clock,
  BookOpen,
  Eye,
  EyeOff,
  Hash,
  Layers,
  ListOrdered,
} from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Separator } from "@ui/components/separator";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api";
import { formatDateTime, PERMISSION_CODES, canUserAccess } from "@workspace/api-client";
import { useGuideDetailQuery, parseContent } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

function GuideDetailInner() {
  const router = useRouter();
  const params = useParams();
  const guideId = params.id as string;
  const { user } = useAuth();
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.PAGE_CONTENTS_UPDATE) : false;

  const { data: guide, isLoading, isError } = useGuideDetailQuery(api, guideId);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được nhóm hướng dẫn");
      router.push("/guides");
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!guide) return null;

  const content = parseContent(guide.content);
  const steps = content.steps ?? [];

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => router.push("/guides")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {content.title || guide.sectionKey}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Hướng dẫn</span>
              <span className="mx-1.5 text-muted-foreground/40">/</span>
              {guide.sectionKey}
            </p>
          </div>
        </div>
        {canUpdate && (
        <Button
          type="button"
          variant="default"
          className="gap-2 rounded-lg px-5 font-semibold"
          onClick={() => router.push(`/guides/${guideId}/edit`)}
        >
          <Pencil className="size-4" />
          Chỉnh sửa
        </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 my-6">
        <div className="space-y-6 lg:col-span-2">
          {steps.length > 0 && (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="size-5 text-primary" />
                  Các bước thực hiện
                  <Badge variant="secondary" className="ml-auto">{steps.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {step.order ?? idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                      {step.imageUrl && (
                        <img
                          src={step.imageUrl}
                          alt={step.title}
                          className="mt-2 max-h-48 w-auto rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="size-5 text-primary" />
                Thông tin nhóm hướng dẫn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Hash className="size-3" />
                    Section Key
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">{guide.sectionKey}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <ListOrdered className="size-3" />
                    Thứ tự
                  </p>
                  <p className="mt-1 text-sm font-medium">{content.order ?? 0}</p>
                </div>
              </div>

              {content.description && (
                <>
                  <Separator />
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Mô tả
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{content.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="size-5 text-primary" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Calendar className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ngày tạo</p>
                  <p className="text-sm font-medium">{formatDateTime(guide.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Clock className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="text-sm font-medium">{formatDateTime(guide.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="size-5 text-primary" />
                Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  {guide.isVisible ? (
                    <Eye className="size-3.5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hiển thị</p>
                  <Badge variant={guide.isVisible ? "default" : "secondary"} className="mt-0.5">
                    {guide.isVisible ? "Công khai" : "Ẩn"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  );
}

export default function GuideDetailPage() {
  return (
    <AdminPageGuard permission="page_contents:view">
      <GuideDetailInner />
    </AdminPageGuard>
  );
}
