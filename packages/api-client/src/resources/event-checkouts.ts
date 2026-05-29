import type { ApiClient } from "../client";
import { normalizePagedResult } from "./_shared";

type RequestQuery = Record<string, string | number | boolean | undefined | null>;

export class EventCheckoutsApi {
  constructor(private readonly http: ApiClient) {}

  async list<T = unknown>(params?: RequestQuery): Promise<{ items: T[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/event-checkouts", {
      query: { page: 1, limit: 20, ...params },
    });
    const normalized = normalizePagedResult<T>(payload);
    return { items: normalized.items, total: normalized.total };
  }
}
