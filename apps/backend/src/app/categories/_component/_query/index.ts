import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { CategoryRow, PagedResult } from "../types";
import { normalizePaged } from "../utils";

function toFilterQuery(filters: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value]),
  );
}

export interface UseCategoriesQueryProps {
  api: StoreSyncSdk;
  debouncedQ: string;
  columnFilterQuery: Record<string, unknown>;
}

export function useCategoriesQuery({
  api,
  debouncedQ,
  columnFilterQuery,
}: UseCategoriesQueryProps): UseQueryResult<PagedResult<CategoryRow>> {
  return useQuery({
    queryKey: ["categories", "list", debouncedQ, columnFilterQuery],
    queryFn: async (): Promise<PagedResult<CategoryRow>> =>
      normalizePaged(
        await api.http.get("/admin/categories", {
          query: {
            page: 1,
            limit: 1000,
            search: debouncedQ.trim() || undefined,
            status: "active",
            ...toFilterQuery(columnFilterQuery),
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
}: UseTrashQueryProps): UseQueryResult<PagedResult<CategoryRow>> {
  return useQuery({
    queryKey: ["categories", "trash", trashPage, trashPageSize, debouncedTrashQ, trashColumnFilterQuery],
    enabled,
    queryFn: async (): Promise<PagedResult<CategoryRow>> =>
      normalizePaged(
        await api.http.get("/admin/categories", {
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

export function useCategoriesOptionsQuery(
  api: StoreSyncSdk
): UseQueryResult<CategoryRow[]> {
  return useQuery({
    queryKey: ["categories", "options"],
    queryFn: async (): Promise<CategoryRow[]> => {
      const paged = normalizePaged<CategoryRow>(
        await api.http.get("/admin/categories", {
          query: { page: 1, limit: 1000, status: "active" },
        }),
      );
      return paged.items;
    },
  });
}
