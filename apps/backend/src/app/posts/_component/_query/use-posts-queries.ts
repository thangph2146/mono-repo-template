import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { PostListRow, PagedResult } from "../types";
import { normalizePaged } from "../utils";

function toFilterQuery(filters: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value]),
  );
}

export interface UsePostsQueriesProps {
  api: StoreSyncSdk;
  page: number;
  pageSize: number;
  debouncedQ: string;
  postColumnFilterQuery: Record<string, unknown>;
}

export function usePostsQuery({
  api,
  page,
  pageSize,
  debouncedQ,
  postColumnFilterQuery,
}: UsePostsQueriesProps): UseQueryResult<PagedResult<PostListRow>> {
  return useQuery({
    queryKey: ["media", "posts", "list", page, pageSize, debouncedQ, postColumnFilterQuery],
    queryFn: async (): Promise<PagedResult<PostListRow>> =>
      normalizePaged(
        await api.http.get("/admin/posts", {
          query: {
            page,
            limit: pageSize,
            search: debouncedQ.trim() || undefined,
            status: "active",
            ...toFilterQuery(postColumnFilterQuery),
          },
        }),
      ),
  });
}

export interface UseTrashQueryProps {
  api: StoreSyncSdk;
  trashPage: number;
  trashPageSize: number;
  debouncedTrashQ: string;
  trashColumnFilterQuery?: Record<string, unknown>;
  enabled: boolean;
}

export function useTrashQuery({
  api,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  trashColumnFilterQuery,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<PostListRow>> {
  return useQuery({
    queryKey: ["media", "posts", "trash", trashPage, trashPageSize, debouncedTrashQ, trashColumnFilterQuery],
    enabled,
    queryFn: async (): Promise<PagedResult<PostListRow>> =>
      normalizePaged(
        await api.http.get("/admin/posts", {
          query: {
            page: trashPage,
            limit: trashPageSize,
            search: debouncedTrashQ.trim() || undefined,
            status: "deleted",
            ...toFilterQuery(trashColumnFilterQuery ?? {}),
          },
        }),
      ),
  });
}
