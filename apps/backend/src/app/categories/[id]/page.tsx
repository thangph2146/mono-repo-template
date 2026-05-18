"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Calendar,
  Clock,
  FolderTree,
  Tag,
  FileText,
  Layers,
  Hash,
  ChevronRight,
  File,
} from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Separator } from "@ui/components/separator";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { unwrapEnvelope, formatDateTime } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_SUBTITLE_CLASS,
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  _count: { children: number };
  postCount: number;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface CategoryDetailData {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { children: number };
  postCount: number;
  children: ChildCategory[];
  posts: RelatedPost[];
}

function CategoryDetailInner() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryDetailData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCategory() {
      try {
        setLoading(true);
        const detail = unwrapEnvelope<CategoryDetailData>(
          await api.http.get(`/admin/categories/${categoryId}`),
        );
        if (!cancelled) setCategory(detail);
      } catch {
        if (!cancelled) {
          toast.error("Không tải được danh mục");
          router.push("/categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCategory();
    return () => { cancelled = true; };
  }, [categoryId, router]);

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!category) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => router.push("/categories")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <div>
            <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
              {category.name}
            </TypographyH1>
            <p className={ADMIN_PAGE_SUBTITLE_CLASS}>
              <span className="text-muted-foreground/60">Danh mục</span>
              <span className="mx-1.5 text-muted-foreground/40">/</span>
              {category.parentName ?? "Cấp gốc"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="default"
          className="gap-2 rounded-lg px-5 font-semibold"
          onClick={() => router.push(`/categories/${categoryId}/edit`)}
        >
          <Pencil className="size-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 my-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="size-5 text-primary" />
                Thông tin danh mục
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Hash className="size-3" />
                    Slug / đường dẫn
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">{category.slug}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">/danh-muc/{category.slug}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <FolderTree className="size-3" />
                    Danh mục cha
                  </p>
                  <p className="mt-1 text-sm font-medium">{category.parentName ?? "Cấp gốc"}</p>
                </div>
              </div>

              {category.description && (
                <>
                  <Separator />
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      <FileText className="size-3" />
                      Mô tả
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{category.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {category.children.length > 0 && (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderTree className="size-5 text-primary" />
                  Danh mục con
                  <Badge variant="secondary" className="ml-auto">{category.children.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {category.children.map((child, idx) => (
                  <button
                    key={child.id}
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${idx > 0 ? "border-t border-border/50" : ""}`}
                    onClick={() => router.push(`/categories/${child.id}`)}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <FolderTree className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{child.name}</p>
                      <p className="text-xs text-muted-foreground truncate">/danh-muc/{child.slug}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span>{child._count.children} con</span>
                      <span>{child.postCount} bài</span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {category.posts.length > 0 && (
            <Card className="border border-border/70 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <File className="size-5 text-primary" />
                  Bài viết liên quan
                  <Badge variant="secondary" className="ml-auto">{category.postCount}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {category.posts.map((post, idx) => (
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
                  <p className="text-sm font-medium">{formatDateTime(category.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Clock className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="text-sm font-medium">{formatDateTime(category.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="size-5 text-primary" />
                Phân cấp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <FolderTree className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Danh mục cha</p>
                  <p className="text-sm font-medium">{category.parentName ?? "Cấp gốc"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <Layers className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Danh mục con</p>
                  <p className="text-sm font-medium">{category._count.children} mục</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted">
                  <FileText className="size-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bài viết</p>
                  <p className="text-sm font-medium">{category.postCount} bài</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  );
}

export default function CategoryDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <CategoryDetailInner />
    </AdminPageGuard>
  );
}
