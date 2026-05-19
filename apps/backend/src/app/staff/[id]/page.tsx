"use client";

import { useParams, useRouter } from "next/navigation";
import { useStaffProfile } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ADMIN_PAGE_TITLE_PRIMARY_CLASS, ADMIN_PAGE_TITLE_ICON_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1, TypographyH3 } from "@ui/components/typography";
import { UserCircle, Mail, Phone, ShieldHalf, CheckCircle2, Lock, CalendarClock, Pencil, Trash2, FileText, ArrowRight } from "lucide-react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { isSuperAdminRoleCode } from "@workspace/api-client";
import { formatDateTime } from "@workspace/api-client";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { usePostsByAuthor } from "@/app/posts/_component/_query/use-posts-queries";
import Link from "next/link";
import { api } from "@/lib/api";

function StaffDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);
  const userId = params.id as string;

  const userQuery = useStaffProfile(userId);
  const postsQuery = usePostsByAuthor({
    api,
    authorId: userId,
    limit: 5,
  });

  const user = userQuery.data;
  const posts = postsQuery.data?.items || [];

  if (!session || !canManageUsers) {
    return (
      <>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <UserCircle className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết nhân sự
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không có quyền truy cập</p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (userQuery.isLoading || !user) {
    return (
      <>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <UserCircle className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết nhân sự
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <UserCircle className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết nhân sự
        </TypographyH1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push(`/staff/${userId}/edit`)}
          >
            <Pencil className="size-4" aria-hidden />
            Sửa
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Họ tên</p>
                  <p className="text-sm">{user.fullName}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">SĐT</p>
                    <p className="font-mono text-sm">{user.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vai trò</CardTitle>
            </CardHeader>
            <CardContent>
              {user.roles.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldHalf className="size-3.5 opacity-60" aria-hidden />
                  Chưa gán vai trò
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((r) => (
                    <Badge
                      key={r.code}
                      variant={isSuperAdminRoleCode(r.code) ? "default" : "secondary"}
                      className="text-xs font-normal"
                    >
                      {r.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              {user.isActive ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 pr-2 text-emerald-700"
                >
                  <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                  Hoạt động
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 pr-2 text-muted-foreground"
                >
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  Khoá
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Tạo lúc</p>
                  <p className="text-sm">{formatDateTime(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted-foreground">Cập nhật lần cuối</p>
                  <p className="text-sm">{formatDateTime(user.updatedAt)}</p>
                </div>
              </div>
              {user.deletedAt && (
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-destructive">Xóa lúc</p>
                    <p className="text-sm text-destructive">{formatDateTime(user.deletedAt)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Related Posts Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" aria-hidden />
                Bài viết liên quan
              </CardTitle>
              {postsQuery.data?.total && postsQuery.data.total > 5 && (
                <Link href="/admin/posts">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Xem tất cả
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {postsQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Đang tải bài viết...
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                <FileText className="size-8 opacity-40" aria-hidden />
                <p className="text-sm">Chưa có bài viết nào từ nhân sự này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/admin/posts/${post.id}`}
                    className="block rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <TypographyH3 className="mb-1 truncate text-base font-semibold text-foreground">
                          {post.title}
                        </TypographyH3>
                        <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                          {post.excerpt || "Không có tóm tắt"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="size-3" aria-hidden />
                            {post.publishedAt ? formatDateTime(post.publishedAt) : formatDateTime(post.createdAt)}
                          </span>
                          {post.categories.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{post.categories.map((c) => c.name).join(", ")}</span>
                            </>
                          )}
                          {post.published && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-[10px]">
                                Đã xuất bản
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>  
  );
}

export default function StaffDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <StaffDetailPageInner />
    </AdminPageGuard>
  );
}
