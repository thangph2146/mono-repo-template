"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStaffForm, useStaffMutations } from "../../_component";
import { StaffFormShell } from "../../_component/_form";
import { useRbacCatalog, useStaffProfile } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { Pencil } from "lucide-react";
import { canUserAccess, PERMISSION_CODES } from "@workspace/api-client";
import { Card, CardContent } from "@ui/components/card";
import { api } from "@/lib/api";

function EditStaffPageInner() {
  const params = useParams();
  const router = useRouter();
  const { user: session } = useAuth();
  const canManageUsers =
    session != null && canUserAccess(session, PERMISSION_CODES.USERS_MANAGE);
  const { updateMutation } = useStaffMutations({ api });
  const { form, resetForm, populateForm, getPayload } = useStaffForm({ editingId: params.id as string });

  const userId = params.id as string;

  const userQuery = useStaffProfile(userId);
  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session) && canManageUsers,
  });

  const user = userQuery.data;
  const roles = rbacQuery.data?.roles ?? [];

  // Populate form when user data is loaded
  useEffect(() => {
    if (user) {
      populateForm(user);
    }
  }, [user, populateForm]);

  const handleSubmit = async () => {
    if (!user) return;
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const payload = getPayload();
    try {
      await updateMutation.mutateAsync({ id: user.id, input: payload });
      router.push(`/staff/${userId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    resetForm();
    router.push(`/staff/${userId}`);
  };

  if (!session || !canManageUsers) {
    return (
      <>
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <Pencil className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Sửa nhân sự
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
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <Pencil className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Sửa nhân sự
        </TypographyH1>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </>
    );
  }

  return (
    <StaffFormShell
      isEdit={true}
      form={form}
      roles={roles}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitting={updateMutation.isPending}
    />
  );
}

export default function EditStaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <EditStaffPageInner />
    </AdminPageGuard>
  );
}
