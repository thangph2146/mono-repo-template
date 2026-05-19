"use client";

import { useRouter } from "next/navigation";
import { useStaffForm, useStaffMutations } from "../_component";
import { StaffFormShell } from "../_component/_form";
import { useRbacCatalog } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ADMIN_PAGE_FORM_COLUMN_CLASS, ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { UserPlus } from "lucide-react";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { Card, CardContent } from "@ui/components/card";

function NewStaffPageInner() {
  const router = useRouter();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);
  const { createMutation } = useStaffMutations();
  const { form, resetForm, toggleRole, getPayload } = useStaffForm();

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canManageUsers,
  });

  const roles = rbacQuery.data?.roles ?? [];

  if (!session || !canManageUsers) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <UserPlus className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Thêm nhân sự mới
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không có quyền truy cập</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const payload = getPayload();
    try {
      await createMutation.mutateAsync(payload);
      router.push("/admin/staff");
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    resetForm();
    router.push("/admin/staff");
  };

  return (
    <StaffFormShell
      isEdit={false}
      form={form}
      roles={roles}
      onRoleToggle={toggleRole}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitting={createMutation.isPending}
    />
  );
}

export default function NewStaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <NewStaffPageInner />
    </AdminPageGuard>
  );
}
