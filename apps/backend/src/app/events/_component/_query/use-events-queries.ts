import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { EventDetail, EventRow } from "../types";

export function useEventDetailQuery(apiParam: StoreSyncSdk, id: string): UseQueryResult<EventDetail> {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: async (): Promise<EventDetail> => apiParam.events.get<EventDetail>(id),
    enabled: !!id,
  });
}

export function useEventsListQuery(apiParam: StoreSyncSdk, enabled: boolean, filters?: Record<string, string>): UseQueryResult<EventRow[]> {
  return useQuery({
    queryKey: ["events", "list", filters],
    queryFn: async (): Promise<EventRow[]> => {
      const limit = 100; const items: EventRow[] = [];
      let page = 1; let total = Number.POSITIVE_INFINITY;
      while (items.length < total) {
        const result = await apiParam.events.list<EventRow>({ page, limit, status: "active", ...filters });
        items.push(...result.items); total = result.total;
        if (result.items.length === 0) break; page += 1;
      }
      return items;
    },
    enabled,
  });
}

export interface UseTrashQueryProps {
  api: StoreSyncSdk; trashPage: number; trashPageSize: number; debouncedTrashQ: string; enabled: boolean;
}

export function useEventsTrashQuery({
  api: apiParam, trashPage, trashPageSize, debouncedTrashQ, enabled, filters,
}: UseTrashQueryProps & { filters?: Record<string, string> }): UseQueryResult<PagedResult<EventRow>> {
  return useQuery({
    queryKey: ["events", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: async (): Promise<PagedResult<EventRow>> => apiParam.events.list<EventRow>({
      page: trashPage, limit: trashPageSize, search: debouncedTrashQ.trim() || undefined, status: "deleted", ...filters,
    }),
  });
}
