import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DepartmentConfirmAction, DepartmentFormValues } from "../types";
import { departmentFormSchema } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";

const EMPTY_VALUES: DepartmentFormValues = { name: "", code: "", description: "", status: 1 };

export function buildDepartmentPayload(values: DepartmentFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    description: values.description?.trim() || null,
    status: values.status,
  };
}

export function useDepartmentForm() {
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const resetForm = useCallback(() => { form.reset(EMPTY_VALUES); }, [form]);
  return { form, resetForm };
}

export function useHandleConfirmAction(
  deleteMutation: UseMutationResult<unknown, Error, string>,
  restoreMutation: UseMutationResult<unknown, Error, string>,
  purgeMutation: UseMutationResult<unknown, Error, string>,
  setConfirmAction: React.Dispatch<React.SetStateAction<DepartmentConfirmAction | null>>,
) {
  return useCallback(
    async ({ kind, row }: DepartmentConfirmAction) => {
      try {
        if (kind === "delete") {
          await deleteMutation.mutateAsync(row.id);
          toast.success(`Đã đưa «${row.name}» vào thùng rác`);
        } else if (kind === "restore") {
          await restoreMutation.mutateAsync(row.id);
          toast.success(`Đã khôi phục «${row.name}»`);
        } else if (kind === "purge") {
          await purgeMutation.mutateAsync(row.id);
          toast.success(`Đã xóa vĩnh viễn «${row.name}»`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Không thể thực hiện thao tác";
        toast.error(message);
      } finally {
        setConfirmAction(null);
      }
    },
    [deleteMutation, restoreMutation, purgeMutation, setConfirmAction],
  );
}

export function useConfirmAction() {
  const [confirmAction, setConfirmAction] = useState<DepartmentConfirmAction | null>(null);
  return { confirmAction, setConfirmAction };
}
