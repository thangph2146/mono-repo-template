import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { DepartmentDetail, DepartmentRow } from "../types";

export function useDepartmentDetailQuery(api: StoreSyncSdk, id: string) {
  return useQuery({
    queryKey: ["departments", "detail", id],
    queryFn: () => api.departments.get<DepartmentDetail>(id),
    enabled: !!id,
  });
}

export function useDepartmentsListQuery(api: StoreSyncSdk, enabled: boolean, filters?: Record<string, string>) {
  return useQuery({
    queryKey: ["departments", "list", filters],
    queryFn: async () => {
      const items: DepartmentRow[] = [];
      let page = 1, total = Infinity;
      while (items.length < total) {
        const r = await api.departments.list<DepartmentRow>({ page, limit: 100, status: "active", ...filters });
        items.push(...r.items);
        total = r.total;
        if (!r.items.length) break;
        page++;
      }
      return items;
    },
    enabled,
  });
}

export function useDepartmentsTrashQuery({ api, trashPage, trashPageSize, debouncedTrashQ, enabled, filters }: {
  api: StoreSyncSdk; trashPage: number; trashPageSize: number; debouncedTrashQ: string; enabled: boolean; filters?: Record<string, string>;
}) {
  return useQuery({
    queryKey: ["departments", "trash", trashPage, trashPageSize, debouncedTrashQ, filters],
    enabled,
    queryFn: () => api.departments.list<DepartmentRow>({
      page: trashPage, limit: trashPageSize, search: debouncedTrashQ.trim() || undefined, status: "deleted", ...filters,
    }),
  });
}
