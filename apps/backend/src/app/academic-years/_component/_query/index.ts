import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { AcademicYearDetail, AcademicYearRow } from "../types";

export function useAcademicYearDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<AcademicYearDetail> {
  return useQuery({
    queryKey: ["academic-years", "detail", id],
    queryFn: async (): Promise<AcademicYearDetail> =>
      apiParam.academicYears.get<AcademicYearDetail>(id),
    enabled: !!id,
  });
}

export function useAcademicYearsListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
): UseQueryResult<AcademicYearRow[]> {
  return useQuery({
    queryKey: ["academic-years", "list"],
    queryFn: async (): Promise<AcademicYearRow[]> => {
      const limit = 100;
      const items: AcademicYearRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.academicYears.list<AcademicYearRow>({ page, limit, status: "active" });
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

export function useAcademicYearsTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
}: UseTrashQueryProps): UseQueryResult<PagedResult<AcademicYearRow>> {
  return useQuery({
    queryKey: ["academic-years", "trash", trashPage, trashPageSize, debouncedTrashQ],
    enabled,
    queryFn: async (): Promise<PagedResult<AcademicYearRow>> => {
      return apiParam.academicYears.list<AcademicYearRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
      });
    },
  });
}
