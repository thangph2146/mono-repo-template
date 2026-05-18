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
  PostFormShell,
  usePostForm,
  buildCategoryOptionTree,
  unwrapEnvelope,
  normalizeContentForEditor,
  toLocalInputValue,
} from "../_component";
import { useCategoriesQuery, useTagsQuery } from "../_component/_query";
import type { PostFormValues, PostDetail } from "../_component";

function EditPostPageInner() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const queryClient = useQueryClient();
  const form = usePostForm();
  const [loading, setLoading] = useState(true);

  const categoriesQuery = useCategoriesQuery(api);
  const tagsQuery = useTagsQuery(api);

  const categoryTreeOptions = useMemo(
    () => buildCategoryOptionTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPost() {
      try {
        setLoading(true);
        const detail = unwrapEnvelope<PostDetail>(
          await api.http.get(`/admin/posts/${postId}`),
        );
        if (!cancelled) {
          form.reset({
            id: detail.id,
            title: detail.title,
            slug: detail.slug,
            excerpt: detail.excerpt ?? "",
            image: detail.image ?? "",
            content: normalizeContentForEditor(detail.content),
            published: detail.published,
            publishedAt: toLocalInputValue(detail.publishedAt ?? ""),
            categoryIds: detail.categories.map((item) => item.id),
            tagIds: detail.tags.map((item) => item.id),
          });
        }
      } catch {
        if (!cancelled) {
          toast.error("Không tải được bài viết");
          router.push("/posts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPost();
    return () => { cancelled = true; };
  }, [postId, router, form]);

  const updateMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) =>
      api.http.put(`/admin/posts/${postId}`, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["media", "posts"] });
      toast.success(`Đã cập nhật bài viết "${(variables.title as string)?.trim()}"`);
      router.push("/posts");
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

  if (loading) {
    return (
      <PageSection max="full" className="min-w-0 flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </PageSection>
    );
  }

  return (
    <PageSection max="full" className="min-w-0 space-y-6">
      <PostFormShell
        form={form}
        onSubmit={handleSubmit}
        submitting={updateMutation.isPending}
        editingId={postId}
        categoryTreeOptions={categoryTreeOptions}
        tagsOptions={tagsQuery.data ?? []}
        onBack={() => router.push("/posts")}
        onReset={async () => {
          try {
            setLoading(true);
            const detail = unwrapEnvelope<PostDetail>(
              await api.http.get(`/admin/posts/${postId}`),
            );
            form.reset({
              id: detail.id,
              title: detail.title,
              slug: detail.slug,
              excerpt: detail.excerpt ?? "",
              image: detail.image ?? "",
              content: normalizeContentForEditor(detail.content),
              published: detail.published,
              publishedAt: toLocalInputValue(detail.publishedAt ?? ""),
              categoryIds: detail.categories.map((item) => item.id),
              tagIds: detail.tags.map((item) => item.id),
            });
          } catch {
            toast.error("Không tải lại được bài viết");
          } finally {
            setLoading(false);
          }
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
