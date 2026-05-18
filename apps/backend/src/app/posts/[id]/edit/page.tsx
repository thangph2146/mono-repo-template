"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageSection } from "@ui/components/layout";
import { AdminPageGuard } from "@/components/admin-page-guard";
import { api } from "@/lib/api";
import {
  PostFormShell,
  usePostForm,
  buildCategoryOptionTree,
  normalizeContentForEditor,
  toLocalInputValue,
} from "../../_component";
import { usePostDetailQuery, useCategoriesQuery, useTagsQuery } from "../../_component/_query";
import type { PostFormValues } from "../../_component";

function EditPostPageInner() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const queryClient = useQueryClient();
  const form = usePostForm();

  const { data: post, isLoading, error, refetch } = usePostDetailQuery(api, postId);
  const categoriesQuery = useCategoriesQuery(api);
  const tagsQuery = useTagsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  useEffect(() => {
    if (error) {
      toast.error("Không tải được bài viết");
      router.push("/posts");
    }
  }, [error, router]);

  useEffect(() => {
    if (!post) return;
    form.reset({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? "",
      image: post.image ?? "",
      content: normalizeContentForEditor(post.content),
      published: post.published,
      publishedAt: toLocalInputValue(post.publishedAt ?? ""),
      categoryIds: post.categories.map((item) => item.id),
      tagIds: post.tags.map((item) => item.id),
    });
  }, [post, form]);

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.posts.update(postId, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
      toast.success(`Đã cập nhật bài viết "${(variables.title as string)?.trim()}"`);
      router.push(`/posts/${postId}`);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Không thể cập nhật bài viết";
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
      await updateMutation.mutateAsync(payload);
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  if (!post) return null;

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <PostFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={postId}
        categoryTreeOptions={categoryTreeOptions}
        tagsOptions={tagsQuery.data ?? []}
        onBack={() => router.push(`/posts/${postId}`)}
        onReset={async () => {
          await refetch();
        }}
      />
    </PageSection>
  );
}

export default function EditPostPage() {
  return (
    <AdminPageGuard roles={["super_admin", "admin", "manager"]}>
      <EditPostPageInner />
    </AdminPageGuard>
  );
}
