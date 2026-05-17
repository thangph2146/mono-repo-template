import type { UseMutationResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import type { api } from "@/lib/api";
import type { PostDetail, PostListRow, FormState } from "../types";
import { unwrapEnvelope, normalizeContentForEditor, toLocalInputValue } from "../utils";

export interface UseOpenEditProps {
  setLoadingDetail: (loading: boolean) => void;
  setForm: (form: FormState) => void;
  setEditorTab: (tab: "content" | "seo" | "publish" | "taxonomy") => void;
  setDialogOpen: (open: boolean) => void;
  api: typeof api;
}

export function useOpenEdit({
  setLoadingDetail,
  setForm,
  setEditorTab,
  setDialogOpen,
  api,
}: UseOpenEditProps) {
  return useCallback(async (row: PostListRow) => {
    try {
      setLoadingDetail(true);
      const detail = unwrapEnvelope<PostDetail>(
        await api.http.get(`/admin/posts/${row.id}`),
      );
      setForm({
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
      setEditorTab("content");
      setDialogOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được bài viết");
    } finally {
      setLoadingDetail(false);
    }
  }, [setLoadingDetail, setForm, setEditorTab, setDialogOpen, api]);
}

export interface UseHandleSaveProps {
  form: FormState;
  createMutation: UseMutationResult<unknown, Error, Omit<FormState, "id">, unknown>;
  updateMutation: UseMutationResult<unknown, Error, { id: string; input: Omit<FormState, "id"> }, unknown>;
  setDialogOpen: (open: boolean) => void;
  slugify: (value: string) => string;
  fromLocalInputValue: (value: string) => string;
}

export function useHandleSave({
  form,
  createMutation,
  updateMutation,
  setDialogOpen,
  slugify,
  fromLocalInputValue,
}: UseHandleSaveProps) {
  return useCallback(async () => {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim(),
      image: form.image.trim(),
      content: form.content,
      published: form.published,
      publishedAt: fromLocalInputValue(form.publishedAt),
      categoryIds: form.categoryIds,
      tagIds: form.tagIds,
    };

    if (!payload.title) {
      toast.error("Vui lòng nhập tiêu đề bài viết");
      return;
    }

    try {
      if (form.id) {
        await updateMutation.mutateAsync({ id: form.id, input: payload });
        toast.success(`Đã cập nhật bài viết "${payload.title}"`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(`Đã tạo bài viết "${payload.title}"`);
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được bài viết");
    }
  }, [form, createMutation, updateMutation, setDialogOpen, slugify, fromLocalInputValue]);
}
