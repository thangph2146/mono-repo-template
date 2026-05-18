"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  CategoryFormShell,
  useCategoryForm,
} from "../_component";
import type { CategoryFormValues } from "../_component";

function NewCategoryPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useCategoryForm().form;

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.http.post("/admin/categories", input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã tạo danh mục "${(variables.name as string)?.trim()}"`);
      router.push("/categories");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo danh mục";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: CategoryFormValues) => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim() || values.name.trim().toLowerCase().replace(/\s+/g, "-"),
        description: values.description.trim() || null,
        icon: values.icon || null,
        sortOrder: Number.isFinite(values.sortOrder) ? values.sortOrder : 0,
        parentId: values.parentId === "__root__" ? null : values.parentId,
      };
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <CategoryFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        categoryTreeOptions={[]}
        onBack={() => router.push("/categories")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewCategoryPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewCategoryPageInner />
    </AdminPageGuard>
  );
}
