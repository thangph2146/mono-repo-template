"use client";

import { useRouter } from "next/navigation";
import { useStaffForm, useStaffMutations } from "../_component";
import { StaffFormShell } from "../_component/_form";
import { useRbacCatalog } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { PageSection } from "@ui/components/layout";
import { ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { UserPlus } from "lucide-react";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { Card, CardContent } from "@ui/components/card";
import { api } from "@/lib/api";

function NewStaffPageInner() {
  const router = useRouter();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);
  const { createMutation } = useStaffMutations({ api });
  const { form, resetForm, getPayload } = useStaffForm();

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canManageUsers,
  });

  const roles = rbacQuery.data?.roles ?? [];

  if (!session || !canManageUsers) {
    return (
      <PageSection max="full" className="min-w-0 space-y-6">
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <UserPlus className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Thêm nhân sự mới
        </TypographyH1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Không có quyền truy cập</p>
          </CardContent>
        </Card>
      </PageSection>
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
      router.push("/staff");
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    resetForm();
    router.push("/staff");
  };

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <StaffFormShell
        isEdit={false}
        form={form}
        roles={roles}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={createMutation.isPending}
      />
    </PageSection>
  );
}

export default function NewStaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <NewStaffPageInner />
    </AdminPageGuard>
  );
}
