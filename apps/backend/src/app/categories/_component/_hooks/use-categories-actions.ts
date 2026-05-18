import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { UseMutationResult } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import { toast } from "sonner";
import type { CategoryRow, CategoryConfirmAction } from "../types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const ROOT_PARENT_VALUE = "__root__";

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
  name: "",
  slug: "",
  description: "",
  icon: "Package2",
  sortOrder: 0,
  parentId: ROOT_PARENT_VALUE,
};

export function useCategoryForm() {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    form.reset(EMPTY_VALUES);
    setEditingId(null);
  }, [form]);

  const openCreate = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = useCallback(
    async (c: CategoryRow, api: StoreSyncSdk) => {
      setLoadingDetail(true);
      try {
        const res = await api.http.get(`/admin/categories/${c.id}`);
        const data =
          (res as Record<string, unknown>)?.data as Record<string, unknown> ??
          (res as Record<string, unknown>);
        form.reset({
          name: (data.name as string) ?? "",
          slug: (data.slug as string) ?? "",
          description: (data.description as string) ?? "",
          icon: (data.icon as string) ?? "Package2",
          sortOrder: (data.sortOrder as number) ?? 0,
          parentId: (data.parentId as string) ?? ROOT_PARENT_VALUE,
        });
        setEditingId(c.id);
        setDialogOpen(true);
      } catch {
        toast.error("Không tải được chi tiết danh mục");
      } finally {
        setLoadingDetail(false);
      }
    },
    [form],
  );

  return {
    form,
    dialogOpen,
    setDialogOpen,
    loadingDetail,
    setLoadingDetail,
    editingId,
    openCreate,
    openEdit,
    resetForm,
  };
}

export function useHandleSave({
  editingId,
  createMutation,
  updateMutation,
  setDialogOpen,
  slugify,
}: {
  editingId: string | null;
  createMutation: UseMutationResult<unknown, Error, Record<string, unknown>>;
  updateMutation: UseMutationResult<
    unknown,
    Error,
    { id: string; input: Record<string, unknown> }
  >;
  setDialogOpen: (open: boolean) => void;
  slugify: (input: string) => string;
}) {
  return useCallback(
    async (values: CategoryFormValues): Promise<void> => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim() || slugify(values.name),
        description: values.description.trim() || null,
        icon: values.icon || null,
        sortOrder: Number.isFinite(values.sortOrder) ? values.sortOrder : 0,
        parentId: values.parentId === ROOT_PARENT_VALUE ? null : values.parentId,
      };
      try {
        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, input: payload });
          toast.success(`Đã cập nhật danh mục "${payload.name}"`);
        } else {
          await createMutation.mutateAsync(payload);
          toast.success(`Đã tạo danh mục "${payload.name}"`);
        }
        setDialogOpen(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Đã xảy ra lỗi, vui lòng thử lại";
        toast.error(message);
      }
    },
    [editingId, createMutation, updateMutation, setDialogOpen, slugify],
  );
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
