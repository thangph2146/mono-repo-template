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
  User,
  ImageIcon,
} from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import { LexicalEditor } from "@thangph2146/lexical-editor";
import {
  unwrapEnvelope,
  normalizeContentForEditor,
  formatDateTime,
} from "../_component";
import type { PostDetail } from "../_component";
import { TypographyH1 } from "@ui/components/typography";
import {
  ADMIN_PAGE_TITLE_PRIMARY_CLASS,
} from "@ui/lib/layout-shell";

function PostDetailInner() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPost() {
      try {
        setLoading(true);
        const detail = unwrapEnvelope<PostDetail>(
          await api.http.get(`/admin/posts/${postId}`),
        );
        if (!cancelled) setPost(detail);
      } catch {
        if (!cancelled) {
          toast.error("Không tải được bài viết");
          router.push("/posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPost();
    return () => { cancelled = true; };
  }, [postId, router]);

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!post) return null;

  const content = normalizeContentForEditor(post.content);

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 px-2"
            onClick={() => router.push("/posts")}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
          <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
            {post.title}
          </TypographyH1>
        </div>
        <Button
          type="button"
          variant="default"
          className="gap-2 rounded-lg px-5 font-semibold"
          onClick={() => router.push(`/posts/${postId}/edit`)}
        >
          <Pencil className="size-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 my-6">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nội dung</CardTitle>
            </CardHeader>
            <CardContent>
              {content ? (
                <LexicalEditor value={content} readOnly />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Bài viết chưa có nội dung
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Xuất bản</span>
                {post.published ? (
                  <Badge>Đã xuất bản</Badge>
                ) : (
                  <Badge variant="outline">Bản nháp</Badge>
                )}
              </div>
              {post.publishedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ngày xuất bản</span>
                  <span className="tabular-nums">{formatDateTime(post.publishedAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <User className="size-3.5 shrink-0" />
                <span>{post.author.name ?? post.author.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-3.5 shrink-0" />
                <span>Tạo: {formatDateTime(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>Cập nhật: {formatDateTime(post.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {post.excerpt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tóm tắt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>
          )}

          {post.image && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4" />
                  Ảnh đại diện
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={post.image}
                  alt={post.title}
                  className="max-h-96 w-full rounded-lg object-cover"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              {post.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {post.categories.map((cat) => (
                    <Badge key={cat.id} variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa phân loại</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thẻ</CardTitle>
            </CardHeader>
            <CardContent>
              {post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa có thẻ</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageSection>
  );
}

export default function PostDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <PostDetailInner />
    </AdminPageGuard>
  );
}
