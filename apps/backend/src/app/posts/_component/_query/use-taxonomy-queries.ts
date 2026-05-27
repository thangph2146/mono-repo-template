import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { CategoryTreeOption, TaxonomyOption } from "../types";

export function useCategoriesQuery(
  api: StoreSyncSdk
): UseQueryResult<CategoryTreeOption[]> {
  return useQuery({
    queryKey: ["categories", "options"],
    queryFn: async (): Promise<CategoryTreeOption[]> => {
      const paged = await api.categories.rawList<CategoryTreeOption>({
        page: 1,
        limit: 200,
        status: "active",
      });
      return paged.items.map((item) => ({
        id: String(item.id),
        name: item.name,
        parentId: item.parentId ?? null,
        sortOrder: item.sortOrder ?? 0,
      }));
    },
  });
}

export function useTagsQuery(api: StoreSyncSdk): UseQueryResult<TaxonomyOption[]> {
  return useQuery({
    queryKey: ["tags", "options"],
    queryFn: async (): Promise<TaxonomyOption[]> => {
      const paged = await api.tags.list<TaxonomyOption>({
        page: 1,
        limit: 200,
        status: "active",
      });
      return paged.items;
    },
  });
}
