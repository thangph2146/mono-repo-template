"use client";

import { useParams, useRouter } from "next/navigation";
import { useStaffUserList } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ADMIN_PAGE_FORM_COLUMN_CLASS, ADMIN_PAGE_TITLE_PRIMARY_CLASS, ADMIN_PAGE_TITLE_ICON_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { UserCircle, Mail, Phone, ShieldHalf, CheckCircle2, Lock, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { isSuperAdminRoleCode } from "@workspace/api-client";
import { formatDateTime } from "@workspace/api-client";

function StaffDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const { user: session } = useAuth();
  const userId = params.id as string;

  const usersQuery = useStaffUserList({
    enabled: Boolean(session) && Boolean(userId),
    listParams: { page: 1, limit: 100 },
  });

  const user = usersQuery.data?.items.find((u) => String(u.id) === userId);

  if (!user) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_PRIMARY_CLASS}>
          <UserCircle className={ADMIN_PAGE_TITLE_ICON_CLASS} aria-hidden />
          Chi tiết nhân sự
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không tìm thấy nhân sự</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
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
            onClick={() => router.push(`/admin/staff/${userId}/edit`)}
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
      </div>
    </div>
  );
}

export default function StaffDetailPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <StaffDetailPageInner />
    </AdminPageGuard>
  );
}
