import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { TrainingLevelDetail, TrainingLevelRow } from "../types";

export function useTrainingLevelDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<TrainingLevelDetail> {
  return useQuery({
    queryKey: ["training-levels", "detail", id],
    queryFn: async (): Promise<TrainingLevelDetail> =>
      apiParam.trainingLevels.get<TrainingLevelDetail>(id),
    enabled: !!id,
  });
}

export function useTrainingLevelsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
): UseQueryResult<TrainingLevelRow[]> {
  return useQuery({
    queryKey: ["training-levels", "list"],
    queryFn: async (): Promise<TrainingLevelRow[]> => {
      const limit = 100;
      const items: TrainingLevelRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.trainingLevels.list<TrainingLevelRow>({ page, limit, status: "active" });
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

export function useTrainingLevelsTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<TrainingLevelRow>> {
  return useQuery({
    queryKey: ["training-levels", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled,
    queryFn: async (): Promise<PagedResult<TrainingLevelRow>> => {
      return apiParam.trainingLevels.list<TrainingLevelRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
      });
    },
  });
}
