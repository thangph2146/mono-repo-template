"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { canUserAccess, type PermissionCode } from "@workspace/api-client";
import { useAuth } from "@/providers/auth-provider";

const BYPASS_ROLES = ["super_admin", "admin"] as const;

interface AdminPageGuardProps {
  /** Quyền bắt buộc — nếu không có sẽ hiện màn hình "Không có quyền". */
  permission?: PermissionCode;
  /** Danh sách role được phép (khớp role.name). */
  roles?: string[];
  children: ReactNode;
}

/**
 * Bọc nội dung trang, hiện thông báo lỗi khi user không đủ quyền.
 * Super admin (super_admin role) luôn được phép.
 */
export function AdminPageGuard({ permission, roles, children }: AdminPageGuardProps) {
  const { user } = useAuth();

  if (!user) return null;

  const isBypassRole = user.roles?.some((r) => (BYPASS_ROLES as readonly string[]).includes(r.name)) ?? false;
  if (isBypassRole) return <>{children}</>;

  if (roles?.length) {
    const hasRole = user.roles?.some((r) => roles.includes(r.name)) ?? false;
    if (!hasRole) return <AccessDenied />;
  }

  if (permission) {
    if (!canUserAccess(user, permission)) return <AccessDenied />;
  }

  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="p-6">
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <CardTitle className="text-base">Không có quyền truy cập</CardTitle>
            <CardDescription className="mt-1">
              Tài khoản của bạn không có quyền xem trang này.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
