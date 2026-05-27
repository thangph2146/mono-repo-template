import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { PostDetail, PostListRow } from "../types";

function toFilterQuery(filters: Record<string, unknown>): Record<string, string | number | boolean | undefined | null> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value as string | number | boolean | undefined | null]),
  );
}

export function usePostDetailQuery(
  api: StoreSyncSdk,
  postId: string,
): UseQueryResult<PostDetail> {
  return useQuery({
    queryKey: ["media", "posts", "detail", postId],
    queryFn: async (): Promise<PostDetail> =>
      api.posts.get<PostDetail>(postId),
    enabled: !!postId,
  });
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
      api.posts.list<PostListRow>({
        page,
        limit: pageSize,
        search: debouncedQ.trim() || undefined,
        status: "active",
        ...toFilterQuery(postColumnFilterQuery),
      }),
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
      api.posts.list<PostListRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...toFilterQuery(trashColumnFilterQuery ?? {}),
      }),
  });
}

export interface UsePostsByAuthorProps {
  api: StoreSyncSdk;
  authorId: string;
  page?: number;
  limit?: number;
}

export function usePostsByAuthor({
  api,
  authorId,
  page = 1,
  limit = 5,
}: UsePostsByAuthorProps): UseQueryResult<PagedResult<PostListRow>> {
  return useQuery({
    queryKey: ["media", "posts", "by-author", authorId, page, limit],
    queryFn: async (): Promise<PagedResult<PostListRow>> =>
      api.posts.list<PostListRow>({
        page,
        limit,
        status: "active",
        ...toFilterQuery({ authorId }),
      }),
    enabled: !!authorId,
  });
}
