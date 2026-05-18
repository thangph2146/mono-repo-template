import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { PagedResult, TagRow, TagFormValues } from "../types";
import {
  normalizePaged,
  fetchAllActiveTags,
  buildTagsFilterQuery,
  toFilterQuery,
  unwrapEnvelope,
} from "../utils";

export function useTagsListQuery(
  api: StoreSyncSdk,
  enabled: boolean,
): UseQueryResult<TagRow[]> {
  return useQuery({
    queryKey: ["media", "tags", "tree"],
    queryFn: fetchAllActiveTags,
    enabled,
  });
}

export interface UseTrashQueryProps {
  api: StoreSyncSdk;
  trashPage: number;
  trashPageSize: number;
  debouncedTrashQ: string;
  trashColumnFilters: { id: string; value: unknown }[];
  enabled: boolean;
}

export function useTrashQuery({
  api,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  trashColumnFilters,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<TagRow>> {
  return useQuery({
    queryKey: [
      "media",
      "tags",
      "trash",
      trashPage,
      trashPageSize,
      debouncedTrashQ,
      trashColumnFilters,
    ],
    enabled,
    queryFn: async (): Promise<PagedResult<TagRow>> =>
      normalizePaged(
        await api.http.get("/admin/tags", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashQ.trim() || undefined,
            status: "deleted",
            ...toFilterQuery(buildTagsFilterQuery(trashColumnFilters)),
          },
        }),
      ),
  });
}

export function useCreateMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async (input: Omit<TagFormValues, "id">) =>
      unwrapEnvelope<TagRow>(await api.http.post("/admin/tags", input)),
    onSuccess: invalidateAll,
  });
}

export function useUpdateMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Omit<TagFormValues, "id"> }) =>
      unwrapEnvelope<TagRow>(await api.http.put(`/admin/tags/${id}`, input)),
    onSuccess: invalidateAll,
  });
}

export function useDeleteMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async (id: string) =>
      api.http.post("/admin/tags/bulk", {
        action: "delete",
        ids: [String(id).trim()],
      }),
    onSuccess: invalidateAll,
  });
}

export function useRestoreMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async (id: string) =>
      unwrapEnvelope<TagRow>(await api.http.post(`/admin/tags/${id}/restore`)),
    onSuccess: invalidateAll,
  });
}

export function usePurgeMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async (id: string) => api.http.delete(`/admin/tags/${id}/hard-delete`),
    onSuccess: invalidateAll,
  });
}

export function useBulkMutation(api: StoreSyncSdk, invalidateAll: () => Promise<void>) {
  return useMutation({
    mutationFn: async (input: {
      action: "delete" | "restore" | "hard-delete";
      ids: string[];
    }) => api.http.post("/admin/tags/bulk", input),
    onSuccess: invalidateAll,
  });
}
