import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk, PagedResult } from "@workspace/api-client";
import type { CourseDetail, CourseRow } from "../types";

export function useCourseDetailQuery(
  apiParam: StoreSyncSdk,
  id: string,
): UseQueryResult<CourseDetail> {
  return useQuery({
    queryKey: ["courses", "detail", id],
    queryFn: async (): Promise<CourseDetail> =>
      apiParam.courses.get<CourseDetail>(id),
    enabled: !!id,
  });
}

export function useCoursesListQuery(
  apiParam: StoreSyncSdk,
  enabled: boolean,
  filters?: Record<string, string>,
): UseQueryResult<CourseRow[]> {
  return useQuery({
    queryKey: ["courses", "list", filters],
    queryFn: async (): Promise<CourseRow[]> => {
      const limit = 100;
      const items: CourseRow[] = [];
      let page = 1;
      let total = Number.POSITIVE_INFINITY;

      while (items.length < total) {
        const result = await apiParam.courses.list<CourseRow>({ page, limit, status: "active", ...filters });
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

export function useCoursesTrashQuery({
  api: apiParam,
  trashPage,
  trashPageSize,
  debouncedTrashQ,
  enabled,
  filters,
}: UseTrashQueryProps & { filters?: Record<string, string> }): UseQueryResult<PagedResult<CourseRow>> {
  return useQuery({
    queryKey: ["courses", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: async (): Promise<PagedResult<CourseRow>> => {
      return apiParam.courses.list<CourseRow>({
        page: trashPage,
        limit: trashPageSize,
        search: debouncedTrashQ.trim() || undefined,
        status: "deleted",
        ...filters,
      });
    },
  });
}
