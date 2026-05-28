import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { MajorDetail, MajorRow } from "../types";

export function useMajorDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<MajorDetail> {
  return useQuery({
    queryKey: ["majors", "detail", id],
    queryFn: async (): Promise<MajorDetail> =>
      apiParam.majors.get<MajorDetail>(id),
    enabled: !!id,
  });
}

export function useMajorsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
): UseQueryResult<MajorRow[]> {
  return useQuery({
    queryKey: ["majors", "list"],
    queryFn: async (): Promise<MajorRow[]> => {
      const limit = 100;
      const items: MajorRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.majors.list<MajorRow>({ page, limit, status: "active" });
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

export function useMajorsTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<MajorRow>> {
  return useQuery({
    queryKey: ["majors", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled,
    queryFn: async (): Promise<PagedResult<MajorRow>> => {
      return apiParam.majors.list<MajorRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
      });
    },
  });
}
