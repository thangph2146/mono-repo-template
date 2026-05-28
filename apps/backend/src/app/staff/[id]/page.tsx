"use client"

import { useParams, useRouter } from "next/navigation"
import { useStaffProfile } from "@/hooks/queries"
import { useAuth } from "@/providers/auth-provider"
import { AdminPageGuard } from "@/components/admin-page-guard"
import {
  ADMIN_PAGE_TITLE_COMPACT_CLASS,
  ADMIN_PAGE_TITLE_ICON_CLASS,
} from "@ui/lib/layout-shell"
import { TypographyH1 } from "@ui/components/typography"
import {
  Phone,
  ShieldHalf,
  CheckCircle2,
  Lock,
  CalendarClock,
  Trash2,
  Pencil,
  FileText,
  ArrowUpRight,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@ui/components/button"
import { Badge } from "@ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card"
import { PageSection } from "@ui/components/layout"
import {
  canUserAccess,
  formatDateTime,
  isSuperAdminRoleCode,
  PERMISSION_CODES,
} from "@workspace/api-client"
import { usePostsByAuthor } from "@/app/posts/_component/_query/use-posts-queries"
import Link from "next/link"
import { api } from "@/lib/api"
import { AdminDataTable } from "@/components/admin-data-table/admin-data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { PostListRow } from "@/app/posts/_component/types"

const postColumns: ColumnDef<PostListRow, unknown>[] = [
  {
    accessorKey: "title",
    header: "Tiêu đề",
    enableColumnFilter: false,
    cell: ({ row }) => (
      <Link
        href={`/posts/${row.original.id}`}
        className="line-clamp-1 font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "categories",
    header: "Danh mục",
    enableColumnFilter: false,
    cell: ({ row }) => {
      const cats = row.original.categories
      return cats.length > 0 ? (
        cats.map((c) => c.name).join(", ")
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "publishedAt",
    header: "Ngày đăng",
    enableColumnFilter: false,
    cell: ({ row }) =>
      row.original.publishedAt
        ? formatDateTime(row.original.publishedAt)
        : formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "published",
    header: "Trạng thái",
    enableColumnFilter: false,
    cell: ({ row }) =>
      row.original.published ? (
        <Badge variant="secondary" className="text-xs">
          Đã xuất bản
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Nháp
        </Badge>
      ),
  },
]

function StaffDetailPageInner() {
  const params = useParams()
  const router = useRouter()
  const { user: session } = useAuth()
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE)
  const userId = params.id as string

  const userQuery = useStaffProfile(userId)
  const postsQuery = usePostsByAuthor({
    api,
    authorId: userId,
    limit: 5,
  })

  const user = userQuery.data
  const posts = postsQuery.data?.items || []

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  if (!session || !canManageUsers) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push(`/staff`)}>
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại
          </Button>
          <TypographyH1 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
            <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Chi tiết nhân sự
          </TypographyH1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không có quyền truy cập</p>
          </CardContent>
        </Card>
      </PageSection>
    )
  }

  if (userQuery.isLoading || !user) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push(`/staff`)}>
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại
          </Button>
          <TypographyH1 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
            <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Chi tiết nhân sự
          </TypographyH1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </PageSection>
    )
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-2">
          <Button variant="outline" onClick={() => router.push(`/staff`)}>
            <ArrowLeft className="size-4" aria-hidden />
            Quay lại
          </Button>
          <TypographyH1 className={ADMIN_PAGE_TITLE_COMPACT_CLASS}>
            <FileText className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
            Chi tiết nhân sự
          </TypographyH1>
        </div>
        <Button
          type="button"
          variant="default"
          onClick={() => router.push(`/staff/${userId}/edit`)}
        >
          <Pencil className="size-4" aria-hidden />
          Chỉnh sửa
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="size-24">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="size-24 rounded-full border-2 border-border/60 object-cover shadow-sm"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-2 border-border/60 bg-muted text-2xl font-bold text-muted-foreground">
                  {initials(user.fullName)}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5" aria-hidden />
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-2">
              {user.isActive ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 text-emerald-700"
                >
                  <CheckCircle2 className="size-3" aria-hidden />
                  Hoạt động
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 text-muted-foreground"
                >
                  <Lock className="size-3" aria-hidden />
                  Khoá
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {user.roles.map((r) => (
                <Badge
                  key={r.code}
                  variant={
                    isSuperAdminRoleCode(r.code) ? "default" : "secondary"
                  }
                  className="text-xs font-normal"
                >
                  <ShieldHalf className="mr-1 size-3" aria-hidden />
                  {r.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" aria-hidden />
              Thời gian hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CalendarClock
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Tạo lúc
                  </p>
                  <p className="text-sm font-medium">
                    {formatDateTime(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                <CalendarClock
                  className="size-5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Cập nhật lần cuối
                  </p>
                  <p className="text-sm font-medium">
                    {formatDateTime(user.updatedAt)}
                  </p>
                </div>
              </div>
              {user.deletedAt && (
                <div className="flex items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <Trash2
                    className="size-5 shrink-0 text-destructive"
                    aria-hidden
                  />
                  <div>
                    <p className="text-xs font-semibold text-destructive">
                      Xóa lúc
                    </p>
                    <p className="text-sm font-medium text-destructive">
                      {formatDateTime(user.deletedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-primary" aria-hidden />
              Bài viết liên quan
            </CardTitle>
            {postsQuery.data?.total && postsQuery.data.total > 5 && (
              <Link href="/posts">
                <Button variant="ghost" size="sm" className="gap-1">
                  Xem tất cả
                  <ArrowUpRight className="size-4" aria-hidden />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AdminDataTable<PostListRow>
            data={posts}
            columns={postColumns}
            isLoading={postsQuery.isLoading}
            emptyLabel="Chưa có bài viết nào từ nhân sự này"
            footer={
              postsQuery.data?.total != null ? (
                <p className="text-xs text-muted-foreground">
                  Tổng số:{" "}
                  <span className="font-semibold text-foreground">
                    {postsQuery.data.total}
                  </span>{" "}
                  bài viết
                  {postsQuery.data.total > 5 && (
                    <span className="ml-1">(hiện 5 mới nhất)</span>
                  )}
                </p>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </PageSection>
  )
}

export default function StaffDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <StaffDetailPageInner />
    </AdminPageGuard>
  )
}
