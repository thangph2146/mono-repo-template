import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { FormState, PostDetail, PostListRow } from "../types";
import { unwrapEnvelope } from "../utils";
import { fromLocalInputValue } from "../utils";

export interface UsePostsMutationsProps {
  api: StoreSyncSdk;
  invalidateAll: () => Promise<void>;
}

export function useCreateMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<PostDetail, Error, Omit<FormState, "id">, unknown> {
  return useMutation({
    mutationFn: async (input: Omit<FormState, "id">) =>
      unwrapEnvelope<PostDetail>(
        await api.http.post("/admin/posts", {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt || null,
          image: input.image || null,
          content: input.content,
          published: input.published,
          publishedAt: fromLocalInputValue(input.publishedAt),
          categoryIds: input.categoryIds,
          tagIds: input.tagIds,
        }),
      ),
    onSuccess: invalidateAll,
  });
}

export function useUpdateMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<PostDetail, Error, { id: string; input: Omit<FormState, "id"> }, unknown> {
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Omit<FormState, "id"> }) =>
      unwrapEnvelope<PostDetail>(
        await api.http.put(`/admin/posts/${id}`, {
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt || null,
          image: input.image || null,
          content: input.content,
          published: input.published,
          publishedAt: fromLocalInputValue(input.publishedAt),
          categoryIds: input.categoryIds,
          tagIds: input.tagIds,
        }),
      ),
    onSuccess: invalidateAll,
  });
}

export function useDeleteMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<unknown, Error, string, unknown> {
  return useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/posts/${id}`),
    onSuccess: invalidateAll,
  });
}

export function useRestoreMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<PostListRow, Error, string, unknown> {
  return useMutation({
    mutationFn: async (id: string) =>
      unwrapEnvelope<PostListRow>(await api.http.post(`/admin/posts/${id}/restore`)),
    onSuccess: invalidateAll,
  });
}

export function usePurgeMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<unknown, Error, string, unknown> {
  return useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/posts/${id}/hard-delete`),
    onSuccess: invalidateAll,
  });
}

export function useBulkMutation({
  api,
  invalidateAll,
}: UsePostsMutationsProps): UseMutationResult<unknown, Error, { action: "delete" | "restore" | "hard-delete"; ids: string[] }, unknown> {
  return useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/posts/bulk", input),
    onSuccess: invalidateAll,
  });
}
