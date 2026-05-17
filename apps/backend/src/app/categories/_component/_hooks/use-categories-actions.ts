import { useCallback, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import { toast } from "sonner";
import type { CategoryRow, CategoryConfirmAction, FormState } from "../types";

const ROOT_PARENT_VALUE = "__root__";

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  icon: "Package2",
  sortOrder: 0,
  parentId: ROOT_PARENT_VALUE,
};

export function useOpenEdit({
  setLoadingDetail,
  setForm,
  setDialogOpen,
  api,
}: {
  setLoadingDetail: React.Dispatch<React.SetStateAction<boolean>>;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  api: StoreSyncSdk;
}) {
  return useCallback(
    async (c: CategoryRow) => {
      setLoadingDetail(true);
      try {
        const res = await api.http.get(`/admin/categories/${c.id}`);
        const data = (res as Record<string, unknown>)?.data as Record<string, unknown> ?? res as Record<string, unknown>;
        setForm({
          id: data.id as string,
          name: data.name as string,
          slug: data.slug as string,
          description: (data.description as string) ?? "",
          icon: (data.icon as string) ?? "Package2",
          sortOrder: (data.sortOrder as number) ?? 0,
          parentId: (data.parentId as string) ?? ROOT_PARENT_VALUE,
        });
        setDialogOpen(true);
      } catch {
        toast.error("Không tải được chi tiết danh mục");
      } finally {
        setLoadingDetail(false);
      }
    },
    [api, setLoadingDetail, setForm, setDialogOpen]
  );
}

export function useHandleSave({
  form,
  createMutation,
  updateMutation,
  setDialogOpen,
  slugify,
}: {
  form: FormState;
  createMutation: UseMutationResult<unknown, Error, Record<string, unknown>>;
  updateMutation: UseMutationResult<unknown, Error, { id: string; input: Record<string, unknown> }>;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  slugify: (input: string) => string;
}) {
  return useCallback(async (): Promise<void> => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      icon: form.icon || null,
      sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
      parentId: form.parentId === ROOT_PARENT_VALUE ? null : form.parentId,
    };
    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
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
  }, [form, createMutation, updateMutation, setDialogOpen, slugify]);
}

export function useHandleConfirmAction(
  deleteMutation: UseMutationResult<unknown, Error, string>,
  restoreMutation: UseMutationResult<unknown, Error, string>,
  purgeMutation: UseMutationResult<unknown, Error, string>,
  setConfirmAction: React.Dispatch<React.SetStateAction<CategoryConfirmAction | null>>
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
    [deleteMutation, restoreMutation, purgeMutation, setConfirmAction]
  );
}

export function useFormState() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  return { form, setForm, dialogOpen, setDialogOpen, loadingDetail, setLoadingDetail };
}

export function useConfirmAction() {
  const [confirmAction, setConfirmAction] = useState<CategoryConfirmAction | null>(null);
  return { confirmAction, setConfirmAction };
}
