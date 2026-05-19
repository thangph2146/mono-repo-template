"use client";

import { useParams, useRouter } from "next/navigation";
import { useStaffForm, useStaffMutations } from "../../_component";
import { StaffFormShell } from "../../_component/_form";
import { useStaffUserList } from "@/hooks/queries";
import { useRbacCatalog } from "@/hooks/queries";
import { useAuth } from "@/providers/auth-provider";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { toast } from "sonner";
import { ADMIN_PAGE_FORM_COLUMN_CLASS, ADMIN_PAGE_TITLE_FORM_CLASS, ADMIN_PAGE_TITLE_ICON_SM_CLASS } from "@ui/lib/layout-shell";
import { TypographyH1 } from "@ui/components/typography";
import { Pencil } from "lucide-react";

function EditStaffPageInner() {
  const params = useParams();
  const router = useRouter();
  const { user: session } = useAuth();
  const { updateMutation } = useStaffMutations();
  const { formEmail, setFormEmail, formPassword, setFormPassword, formFullName, setFormFullName, formActive, setFormActive, formRoles, resetForm, populateForm, toggleRole } = useStaffForm({ editingId: params.id as string });

  const userId = params.id as string;

  const usersQuery = useStaffUserList({
    enabled: Boolean(session) && Boolean(userId),
    listParams: { page: 1, limit: 100 },
  });

  const rbacQuery = useRbacCatalog({
    enabled: Boolean(session),
  });

  const user = usersQuery.data?.items.find((u) => String(u.id) === userId);
  const roles = rbacQuery.data?.roles ?? [];

  // Populate form when user data is loaded
  if (user && !formEmail) {
    populateForm(user);
  }

  const handleSubmit = async () => {
    if (!user) return;
    const fullName = formFullName.trim();
    if (!fullName) {
      toast.error("Nhập họ tên");
      return;
    }
    const payload: {
      fullName: string;
      isActive: boolean;
      roleCodes: string[];
      password?: string;
    } = {
      fullName,
      isActive: formActive,
      roleCodes: formRoles,
    };
    const pw = formPassword.trim();
    if (pw.length > 0) {
      if (pw.length < 6) {
        toast.error("Mật khẩu mới tối thiểu 6 ký tự");
        return;
      }
      payload.password = pw;
    }
    try {
      await updateMutation.mutateAsync({ id: user.id, input: payload });
      router.push(`/admin/staff/${userId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    resetForm();
    router.push(`/admin/staff/${userId}`);
  };

  if (!user) {
    return (
      <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
        <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
          <Pencil className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
          Sửa nhân sự
        </TypographyH1>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ADMIN_PAGE_FORM_COLUMN_CLASS}>
      <TypographyH1 className={ADMIN_PAGE_TITLE_FORM_CLASS}>
        <Pencil className={ADMIN_PAGE_TITLE_ICON_SM_CLASS} aria-hidden />
        Sửa nhân sự
      </TypographyH1>
      <StaffFormShell
        open={true}
        onOpenChange={(open) => !open && handleCancel()}
        isEdit={true}
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
        submitting={updateMutation.isPending}
      />
    </div>
  );
}

export default function EditStaffPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin"]}>
      <EditStaffPageInner />
    </AdminPageGuard>
  );
}
