"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  PostFormShell,
  usePostForm,
  buildCategoryOptionTree,
} from "../_component";
import { useCategoriesQuery, useTagsQuery } from "../_component/_query";
import type { PostFormValues } from "../_component";

function NewPostPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = usePostForm();

  const categoriesQuery = useCategoriesQuery(api);
  const tagsQuery = useTagsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.http.post("/admin/posts", input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
      toast.success(`Đã tạo bài viết "${(variables.title as string)?.trim()}"`);
      router.push("/posts");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể tạo bài viết";
      toast.error(message);
    },
  });

  const handleSubmit = useCallback(
    async (values: PostFormValues) => {
      const payload = {
        title: values.title.trim(),
        slug: values.slug.trim() || values.title.trim().toLowerCase().replace(/\s+/g, "-"),
        excerpt: values.excerpt.trim() || null,
        image: values.image.trim() || null,
        content: values.content,
        published: values.published,
        publishedAt: values.publishedAt || null,
        categoryIds: values.categoryIds,
        tagIds: values.tagIds,
      };
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <PostFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending}
        editingId={null}
        categoryTreeOptions={categoryTreeOptions}
        tagsOptions={tagsQuery.data ?? []}
        onBack={() => router.push("/posts")}
        onReset={() => { form.reset(); }}
      />
    </PageSection>
  );
}

export default function NewPostPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <NewPostPageInner />
    </AdminPageGuard>
  );
}
