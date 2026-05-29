import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { SeoMetaDetail, SeoMetaRow } from "../types";

export function useSeoMetaDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<SeoMetaDetail> {
  return useQuery({
    queryKey: ["seo-metas", "detail", id],
    queryFn: async (): Promise<SeoMetaDetail> =>
      apiParam.seoMetas.get<SeoMetaDetail>(id),
    enabled: !!id,
  });
}

export function useSeoMetasListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
  filters?: Record<string, string>,
): UseQueryResult<SeoMetaRow[]> {
  return useQuery({
    queryKey: ["seo-metas", "list", filters],
    queryFn: async (): Promise<SeoMetaRow[]> => {
      const limit = 100;
      const items: SeoMetaRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.seoMetas.list<SeoMetaRow>({ page, limit, status: "active", ...filters });
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
  enabled: boolean;
}

export function useSeoMetasTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
  filters,
}: UseTrashQueryProps & { filters?: Record<string, string> }): UseQueryResult<PagedResult<SeoMetaRow>> {
  return useQuery({
    queryKey: ["seo-metas", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: async (): Promise<PagedResult<SeoMetaRow>> => {
      return apiParam.seoMetas.list<SeoMetaRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...filters,
      });
    },
  });
}
