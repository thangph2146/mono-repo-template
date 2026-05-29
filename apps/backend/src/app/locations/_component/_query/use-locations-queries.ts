import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { LocationDetail, LocationRow } from "../types";

export function useLocationDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<LocationDetail> {
  return useQuery({
    queryKey: ["locations", "detail", id],
    queryFn: async (): Promise<LocationDetail> =>
      apiParam.locations.get<LocationDetail>(id),
    enabled: !!id,
  });
}

export function useLocationsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
  filters?: Record<string, string>,
): UseQueryResult<LocationRow[]> {
  return useQuery({
    queryKey: ["locations", "list", filters],
    queryFn: async (): Promise<LocationRow[]> => {
      const limit = 100;
      const items: LocationRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.locations.list<LocationRow>({ page, limit, status: "active", ...filters });
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

export function useLocationsTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
  filters,
}: UseTrashQueryProps & { filters?: Record<string, string> }): UseQueryResult<PagedResult<LocationRow>> {
  return useQuery({
    queryKey: ["locations", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: async (): Promise<PagedResult<LocationRow>> => {
      return apiParam.locations.list<LocationRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...filters,
      });
    },
  });
}
