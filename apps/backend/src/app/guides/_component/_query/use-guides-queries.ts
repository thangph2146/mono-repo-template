"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";
import type { ListResult, GuideGroup } from "../types";
import { PAGE_KEY } from "../utils";

export interface UseGuidesQueryProps {
  api: StoreSyncSdk;
  page: number;
  limit?: number;
  search?: string;
}

export function useGuidesQuery({
  api,
  page,
  limit = 50,
  search = "",
}: UseGuidesQueryProps): UseQueryResult<ListResult> {
  return useQuery({
    queryKey: ["admin", "guides", page, search],
    queryFn: async (): Promise<ListResult> => {
      const payload = await api.guides.list<GuideGroup>({
        page,
        limit,
        search: search.trim() || PAGE_KEY,
      });
      return {
        data: payload.items,
        pagination: {
          page,
          limit,
          total: payload.total,
          totalPages: Math.ceil(payload.total / limit),
        },
      };
    },
    staleTime: 15_000,
  });
}

export function useGuideDetailQuery(
  api: StoreSyncSdk,
  id: string | null,
): UseQueryResult<GuideGroup | null> {
  return useQuery({
    queryKey: ["admin", "guides", "detail", id],
    queryFn: async (): Promise<GuideGroup | null> => {
      if (!id) return null;
      return api.guides.get<GuideGroup>(id);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
