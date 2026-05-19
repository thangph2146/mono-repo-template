import { useState, useCallback } from "react";
import { z } from "zod";

export const staffFormSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(1, "Họ tên không được để trống"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  isActive: z.boolean(),
  roleCodes: z.array(z.string()),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

interface UseStaffFormOptions {
  editingId?: string | null;
}

export function useStaffForm(options: UseStaffFormOptions = {}) {
  const { editingId } = options;

  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFullName, setFormFullName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formRoles, setFormRoles] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setFormEmail("");
    setFormPassword("");
    setFormFullName("");
    setFormActive(true);
    setFormRoles([]);
  }, []);

  const populateForm = useCallback((user: {
    email: string;
    fullName: string;
    isActive: boolean;
    roles: { code: string }[];
  }) => {
    setFormEmail(user.email);
    setFormPassword("");
    setFormFullName(user.fullName);
    setFormActive(user.isActive);
    setFormRoles(user.roles.map((r) => r.code));
  }, []);

  const toggleRole = useCallback((code: string, checked: boolean) => {
    setFormRoles((prev) => {
      if (checked) return [...new Set([...prev, code])];
      return prev.filter((c) => c !== code);
    });
  }, []);

  const getPayload = useCallback((): {
    email?: string;
    fullName: string;
    password?: string;
    isActive: boolean;
    roleCodes: string[];
  } => {
    const payload: {
      email?: string;
      fullName: string;
      password?: string;
      isActive: boolean;
      roleCodes: string[];
    } = {
      fullName: formFullName.trim(),
      isActive: formActive,
      roleCodes: formRoles,
    };

    if (!editingId) {
      payload.email = formEmail.trim();
      payload.password = formPassword.trim();
    } else {
      const pw = formPassword.trim();
      if (pw.length > 0) {
        payload.password = pw;
      }
    }

    return payload;
  }, [formEmail, formFullName, formPassword, formActive, formRoles, editingId]);

  return {
    formEmail,
    setFormEmail,
    formPassword,
    setFormPassword,
    formFullName,
    setFormFullName,
    formActive,
    setFormActive,
    formRoles,
    setFormRoles,
    resetForm,
    populateForm,
    toggleRole,
    getPayload,
  };
}
