"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  CategoryFormShell,
  useCategoryForm,
  useCategoriesOptionsQuery,
  buildCategoryOptionTree,
  buildCategoryPayload,
  unwrapEnvelope,
} from "../../_component";
import type { CategoryFormValues } from "../../_component";
import type { CategoryRow } from "../../_component/types";

function EditCategoryPageInner() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  const queryClient = useQueryClient();
  const { form } = useCategoryForm();
  const [loading, setLoading] = useState(true);

  const categoriesOptionsQuery = useCategoriesOptionsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesOptionsQuery.data ?? []),
    [categoriesOptionsQuery.data],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCategory() {
      try {
        setLoading(true);
        const detail = unwrapEnvelope<CategoryRow>(
          await api.http.get(`/admin/categories/${categoryId}`),
        );
        if (!cancelled) {
          form.reset({
            name: detail.name ?? "",
            slug: detail.slug ?? "",
            description: detail.description ?? "",
            icon: detail.icon ?? "Package2",
            sortOrder: detail.sortOrder ?? 0,
            parentId: detail.parentId ?? "__root__",
          });
        }
      } catch {
        if (!cancelled) {
          toast.error("Không tải được danh mục");
          router.push("/categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCategory();
    return () => { cancelled = true; };
  }, [categoryId, router, form]);

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.http.put(`/admin/categories/${categoryId}`, input),
    onSuccess: async (_data, variables) => {
      await invalidateAll();
      toast.success(`Đã cập nhật danh mục "${(variables.name as string)?.trim()}"`);
      router.push(`/categories/${categoryId}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật danh mục";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: CategoryFormValues) => {
      await updateMutation.mutateAsync(buildCategoryPayload(values));
    },
    [updateMutation],
  );

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <CategoryFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={categoryId}
        categoryTreeOptions={categoryTreeOptions}
        onBack={() => router.push(`/categories/${categoryId}`)}
        onReset={async () => {
          try {
            setLoading(true);
            const detail = unwrapEnvelope<CategoryRow>(
              await api.http.get(`/admin/categories/${categoryId}`),
            );
            form.reset({
              name: detail.name ?? "",
              slug: detail.slug ?? "",
              description: detail.description ?? "",
              icon: detail.icon ?? "Package2",
              sortOrder: detail.sortOrder ?? 0,
              parentId: detail.parentId ?? "__root__",
            });
          } catch {
            toast.error("Không tải lại được danh mục");
          } finally {
            setLoading(false);
          }
        }}
      />
    </PageSection>
  );
}

export default function EditCategoryPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditCategoryPageInner />
    </AdminPageGuard>
  );
}
