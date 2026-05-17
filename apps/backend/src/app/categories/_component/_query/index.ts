import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { CategoryRow, PagedResult } from "../types";
import { normalizePaged } from "../utils";

export interface UseCategoriesQueryProps {
  api: StoreSyncSdk;
  page: number;
  pageSize: number;
  debouncedQ: string;
  columnFilterQuery: Record<string, unknown>;
}

export function useCategoriesQuery({
  api,
  page,
  pageSize,
  debouncedQ,
  columnFilterQuery,
}: UseCategoriesQueryProps): UseQueryResult<PagedResult<CategoryRow>> {
  return useQuery({
    queryKey: ["categories", "list", page, pageSize, debouncedQ, columnFilterQuery],
    queryFn: async (): Promise<PagedResult<CategoryRow>> =>
      normalizePaged(
        await api.http.get("/admin/categories", {
          query: {
            page,
            limit: pageSize,
            search: debouncedQ.trim() || undefined,
            status: "active",
            ...Object.fromEntries(
              Object.entries(columnFilterQuery).map(([key, value]) => [
                `filter[${key}]`,
                value,
              ]),
            ),
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
            ...Object.fromEntries(
              Object.entries(trashColumnFilterQuery ?? {}).map(([key, value]) => [
                `filter[${key}]`,
                value,
              ]),
            ),
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
      const result = await api.http.get("/admin/categories", {
        query: { page: 1, limit: 1000, status: "active" },
      });
      const normalized = normalizePaged(result);
      return normalized.items as CategoryRow[];
    },
  });
}
