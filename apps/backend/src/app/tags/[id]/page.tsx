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
  Hash,
  Tag,
  FileText,
  File,
  ChevronRight,
} from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { useAuth } from "@/providers/auth-provider";
import { PERMISSION_CODES, canUserAccess } from "@workspace/api-client";
import { api } from "@/lib/api";
import { formatDateTime, useTagDetailQuery } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

function TagDetailInner() {
  const router = useRouter();
  const params = useParams();
  const tagId = params.id as string;
  const { user } = useAuth();
  const canUpdate = user ? canUserAccess(user, PERMISSION_CODES.TAGS_UPDATE) : false;

  const { data: tag, isLoading, isError } = useTagDetailQuery(api, tagId);

  useEffect(() => {
    if (isError) {
      toast.error("Không tải được thẻ");
      router.push("/tags");
    }
  }, [isError, router]);

  if (isLoading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!tag) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => router.push("/tags")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {tag.name}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Thẻ</span>
              <span className="mx-1.5 text-muted-foreground/40">/</span>
              {tag.slug}
            </p>
          </div>
        </div>
        {canUpdate && (
        <Button
          type="button"
          variant="default"
          className="gap-2 rounded-lg px-5 font-semibold"
          onClick={() => router.push(`/tags/${tagId}/edit`)}
        >
          <Pencil className="size-4" />
          Chỉnh sửa
        </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 my-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="size-5 text-primary" />
                Thông tin thẻ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Hash className="size-3" />
                    Slug / đường dẫn
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">{tag.slug}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">/the/{tag.slug}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <FileText className="size-3" />
                    Bài viết gắn thẻ
                  </p>
                  <p className="mt-1 text-sm font-medium">{tag.postCount ?? 0} bài</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {tag.posts.length > 0 && (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <File className="size-5 text-primary" />
                  Bài viết liên quan
                  <Badge variant="secondary" className="ml-auto">{tag.postCount}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {tag.posts.map((post, idx) => (
                  <button
                    key={post.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${idx > 0 ? "border-t border-border/50" : ""}`}
                    onClick={() => router.push(`/posts/${post.id}`)}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                      <File className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(post.createdAt)}</p>
                    </div>
                    <Badge variant={post.published ? "default" : "outline"} className="shrink-0">
                      {post.published ? "Đã đăng" : "Nháp"}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
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
                  <p className="text-sm font-medium">{formatDateTime(tag.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Clock className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="text-sm font-medium">{formatDateTime(tag.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="size-5 text-primary" />
                Thống kê
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <File className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bài viết</p>
                  <p className="text-sm font-medium">{tag.postCount ?? 0} bài</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  );
}

export default function TagDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <TagDetailInner />
    </AdminPageGuard>
  );
}