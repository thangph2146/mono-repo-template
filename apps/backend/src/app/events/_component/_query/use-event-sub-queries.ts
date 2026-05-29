import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import type { StoreSyncSdk } from "@workspace/api-client";

type Dict = Record<string, unknown>;

export function useEventRegistrationsQuery(apiParam: StoreSyncSdk, eventId: string): UseQueryResult<Dict[]> {
  return useQuery({
    queryKey: ["events", eventId, "registrations"],
    queryFn: async (): Promise<Dict[]> => {
      const result = await apiParam.eventRegistrations.list<Dict>({ eventId, limit: 100 });
      return result.items;
    },
    enabled: !!eventId,
  });
}

export function useEventCheckinsQuery(apiParam: StoreSyncSdk, eventId: string): UseQueryResult<Dict[]> {
  return useQuery({
    queryKey: ["events", eventId, "checkins"],
    queryFn: async (): Promise<Dict[]> => {
      const result = await apiParam.eventCheckins.list<Dict>({ eventId, limit: 100 });
      return result.items;
    },
    enabled: !!eventId,
  });
}

export function useEventSpeakersQuery(apiParam: StoreSyncSdk, eventId: string): UseQueryResult<Dict[]> {
  return useQuery({
    queryKey: ["events", eventId, "speakers"],
    queryFn: async (): Promise<Dict[]> => {
      const result = await apiParam.eventSpeakers.list<Dict>({ eventId, limit: 100 });
      return result.items;
    },
    enabled: !!eventId,
  });
}
