"use client";

import { useRouter } from "next/navigation";
import { useStaffForm, useStaffMutations } from "../_component";
import { StaffFormShell } from "../_component/_form";
import { useRbacCatalog } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { toast } from "sonner";
import { ADMIN_PAGE_FORM_COLUMN_CLASS, ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { UserPlus } from "lucide-react";

function NewStaffPageInner() {
  const router = useRouter();
  const { user: session } = useAuth();
  const { createMutation } = useStaffMutations();
  const { formEmail, setFormEmail, formPassword, setFormPassword, formFullName, setFormFullName, formActive, setFormActive, formRoles, resetForm, toggleRole } = useStaffForm();

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session),
  });

  const roles = rbacQuery.data?.roles ?? [];

  const handleSubmit = async () => {
    const email = formEmail.trim();
    const fullName = formFullName.trim();
    const password = formPassword.trim();
    if (!email || !fullName) {
      toast.error("Nhập email và họ tên");
      return;
    }
    if (password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    try {
      await createMutation.mutateAsync({
        email,
        fullName,
        password,
        isActive: formActive,
        roleCodes: formRoles.length ? formRoles : undefined,
      });
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
    <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
      <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
        <UserPlus className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
        Thêm nhân sự mới
      </TypographyH1>
      <StaffFormShell
        open={true}
        onOpenChange={(open) => !open && handleCancel()}
        isEdit={false}
        formEmail={formEmail}
        formFullName={formFullName}
        formPassword={formPassword}
        formActive={formActive}
        formRoles={formRoles}
        roles={roles}
        onEmailChange={setFormEmail}
        onFullNameChange={setFormFullName}
        onPasswordChange={setFormPassword}
        onActiveChange={setFormActive}
        onRoleToggle={toggleRole}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={createMutation.isPending}
      />
    </div>
  );
}

export default function NewStaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <NewStaffPageInner />
    </AdminPageGuard>
  );
}
