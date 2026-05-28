import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { SpeakerDetail, SpeakerRow } from "../types";

export function useSpeakerDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<SpeakerDetail> {
  return useQuery({
    queryKey: ["speakers", "detail", id],
    queryFn: async (): Promise<SpeakerDetail> =>
      apiParam.speakers.get<SpeakerDetail>(id),
    enabled: !!id,
  });
}

export function useSpeakersListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
): UseQueryResult<SpeakerRow[]> {
  return useQuery({
    queryKey: ["speakers", "list"],
    queryFn: async (): Promise<SpeakerRow[]> => {
      const limit = 100;
      const items: SpeakerRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.speakers.list<SpeakerRow>({ page, limit, status: "active" });
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

export function useSpeakersTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<SpeakerRow>> {
  return useQuery({
    queryKey: ["speakers", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled,
    queryFn: async (): Promise<PagedResult<SpeakerRow>> => {
      return apiParam.speakers.list<SpeakerRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
      });
    },
  });
}
