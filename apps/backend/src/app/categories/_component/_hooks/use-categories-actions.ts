import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CategoryConfirmAction } from "../types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ROOT_PARENT_VALUE = "__root__";

export function buildCategoryPayload(values: {
  name: string; slug: string; description: string; icon: string; sortOrder: number; parentId: string;
}): Record<string, unknown> {
  return {
    name: values.name.trim(),
    slug: values.slug.trim() || values.name.trim().toLowerCase().replace(/\s+/g, "-"),
    description: values.description.trim() || null,
    icon: values.icon || null,
    sortOrder: Number.isFinite(values.sortOrder) ? values.sortOrder : 0,
    parentId: values.parentId === ROOT_PARENT_VALUE ? null : values.parentId,
  };
}

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
  slug: z.string(),
  description: z.string(),
  icon: z.string(),
  sortOrder: z.coerce.number(),
  parentId: z.string(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const EMPTY_VALUES: CategoryFormValues = {
  name: "", slug: "", description: "", icon: "Package2", sortOrder: 0, parentId: ROOT_PARENT_VALUE,
};

export function useCategoryForm() {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const resetForm = useCallback(() => { form.reset(EMPTY_VALUES); }, [form]);
  return { form, resetForm };
}

export function useHandleConfirmAction(
  deleteMutation: UseMutationResult<unknown, Error, string>,
  restoreMutation: UseMutationResult<unknown, Error, string>,
  purgeMutation: UseMutationResult<unknown, Error, string>,
  setConfirmAction: React.Dispatch<React.SetStateAction<CategoryConfirmAction | null>>,
) {
  return useCallback(
    async ({ kind, row }: CategoryConfirmAction) => {
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
        const message =
          err instanceof Error ? err.message : "Không thể thực hiện thao tác";
        toast.error(message);
      } finally {
        setConfirmAction(null);
      }
    },
    [deleteMutation, restoreMutation, purgeMutation, setConfirmAction],
  );
}

export function useConfirmAction() {
  const [confirmAction, setConfirmAction] = useState<CategoryConfirmAction | null>(null);
  return { confirmAction, setConfirmAction };
}
