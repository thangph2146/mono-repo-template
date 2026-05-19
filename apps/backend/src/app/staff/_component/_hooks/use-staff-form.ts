import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export const staffFormSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  fullName: z.string().min(1, "Họ tên không được để trống"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").optional(),
  isActive: z.boolean(),
  roleCodes: z.array(z.string()),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

interface UseStaffFormOptions {
  editingId?: string | null;
}

export function useStaffForm(options: UseStaffFormOptions = {}) {
  const { editingId } = options;

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      isActive: true,
      roleCodes: [],
    },
    mode: "onChange",
  });

  const resetForm = useCallback(() => {
    form.reset({
      email: "",
      fullName: "",
      password: "",
      isActive: true,
      roleCodes: [],
    });
  }, [form]);

  const populateForm = useCallback((user: {
    email: string;
    fullName: string;
    isActive: boolean;
    roles: { code: string }[];
  }) => {
    form.reset({
      email: user.email,
      fullName: user.fullName,
      password: "",
      isActive: user.isActive,
      roleCodes: user.roles.map((r) => r.code),
    });
  }, [form]);

  const toggleRole = useCallback((code: string, checked: boolean) => {
    const currentRoles = form.getValues("roleCodes");
    if (checked) {
      form.setValue("roleCodes", [...new Set([...currentRoles, code])], { shouldDirty: true });
    } else {
      form.setValue("roleCodes", currentRoles.filter((c) => c !== code), { shouldDirty: true });
    }
  }, [form]);

  const getPayload = useCallback((): {
    email: string;
    fullName: string;
    password: string;
    isActive: boolean;
    roleCodes: string[];
} => {
    const values = form.getValues();
    const payload: {
      email: string;
      fullName: string;
      password: string;
      isActive: boolean;
      roleCodes: string[];
    } = {
      fullName: values.fullName.trim(),
      isActive: values.isActive,
      email: "",
      password: "",
      roleCodes: values.roleCodes,
    };

    if (!editingId) {
      payload.email = values.email.trim();
      payload.password = values.password?.trim() || "";
    } else {
      payload.email = values.email.trim();
      const pw = values.password?.trim();
      payload.password = pw || "";
    }

    return payload;
  }, [form, editingId]);

  return {
    form,
    resetForm,
    populateForm,
    toggleRole,
    getPayload,
  };
}
