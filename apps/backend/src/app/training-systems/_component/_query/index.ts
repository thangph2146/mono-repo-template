import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { TrainingSystemDetail, TrainingSystemRow } from "../types";

export function useTrainingSystemDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<TrainingSystemDetail> {
  return useQuery({
    queryKey: ["training-systems", "detail", id],
    queryFn: async (): Promise<TrainingSystemDetail> =>
      apiParam.trainingSystems.get<TrainingSystemDetail>(id),
    enabled: !!id,
  });
}

export function useTrainingSystemsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
  filters?: Record<string, string>,
): UseQueryResult<TrainingSystemRow[]> {
  return useQuery({
    queryKey: ["training-systems", "list", filters],
    queryFn: async (): Promise<TrainingSystemRow[]> => {
      const limit = 100;
      const items: TrainingSystemRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.trainingSystems.list<TrainingSystemRow>({ page, limit, status: "active", ...filters });
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

export function useTrainingSystemsTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
  filters,
}: UseTrashQueryProps & { filters?: Record<string, string> }): UseQueryResult<PagedResult<TrainingSystemRow>> {
  return useQuery({
    queryKey: ["training-systems", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: async (): Promise<PagedResult<TrainingSystemRow>> => {
      return apiParam.trainingSystems.list<TrainingSystemRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...filters,
      });
    },
  });
}
