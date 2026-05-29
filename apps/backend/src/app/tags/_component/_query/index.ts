import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { TagDetail, TagRow } from "../types";
import { api } from "@/lib/api";
import { buildTagsFilterQuery, toFilterQuery } from "../utils";

export function useTagDetailQuery(
  api: StoreSyncSdk,
  tagId: string,
): UseQueryResult<TagDetail> {
  return useQuery({
    queryKey: ["media", "tags", "detail", tagId],
    queryFn: async (): Promise<TagDetail> =>
      api.tags.get<TagDetail>(tagId),
    enabled: !!tagId,
  });
}

export function useTagsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
  filters?: Record<string, string>,
): UseQueryResult<TagRow[]> {
  return useQuery({
    queryKey: ["media", "tags", "tree", filters],
    queryFn: async (): Promise<TagRow[]> => {
      const limit = 100;
      const items: TagRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await api.tags.list<TagRow>({ page, limit, status: "active", ...filters });
        items.push(...result.items);
        total = result.total;
        if (result.items.length === 0) break;
        page += 1;
      }

      return items;
    },
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
  filters?: Record<string, string>;
}

export function useTrashQuery({
  api,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  trashColumnFilters,
  enabled,
  filters,
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
      filters,
    ],
    enabled,
    queryFn: async (): Promise<PagedResult<TagRow>> => {
      return api.tags.list<TagRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...toFilterQuery(buildTagsFilterQuery(trashColumnFilters)),
        ...filters,
      });
    },
  });
}
