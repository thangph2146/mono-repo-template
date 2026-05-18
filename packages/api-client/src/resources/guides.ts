import type { ApiClient } from "../client";
import {
  deleteData,
  getData,
  normalizePagedResult,
  postData,
  putData,
} from "./_shared";

type RequestQuery = Record<string, string | number | boolean | undefined | null>;

/**
 * API cho PageContent (hướng dẫn sử dụng / guides).
 * Endpoint: /admin/page-contents
 */
export class GuidesApi {
  constructor(private readonly http: ApiClient) {}

  async list<T = unknown>(
    params?: RequestQuery,
  ): Promise<{ items: T[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/page-contents", {
      query: {
        page: 1,
        limit: 50,
        ...params,
      },
    });
    const normalized = normalizePagedResult<T>(payload);
    return { items: normalized.items, total: normalized.total };
  }

  async get<T = unknown>(id: string): Promise<T> {
    return getData<T>(this.http, `/admin/page-contents/${id}`);
  }

  async create<T = unknown>(body: Record<string, unknown>): Promise<T> {
    return postData<T>(this.http, "/admin/page-contents", body);
  }

  async update<T = unknown>(
    id: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    return putData<T>(this.http, `/admin/page-contents/${id}`, body);
  }

  async remove(id: string): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/page-contents/${id}`);
  }

  async restore<T = unknown>(id: string): Promise<T> {
    return postData<T>(this.http, `/admin/page-contents/${id}/restore`);
  }

  async purge(id: string): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/page-contents/${id}/hard-delete`);
  }

  async bulk(body: { action: string; ids: string[] }): Promise<void> {
    await postData<unknown>(this.http, "/admin/page-contents/bulk", body);
  }
}
