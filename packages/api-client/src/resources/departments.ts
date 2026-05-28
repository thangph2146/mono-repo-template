import type { ApiClient } from "../client";
import { deleteData, getData, normalizePagedResult, postData, putData } from "./_shared";

type RequestQuery = Record<string, string | number | boolean | undefined | null>;

export class DepartmentsApi {
  constructor(private readonly http: ApiClient) {}

  async list<T = unknown>(params?: RequestQuery): Promise<{ items: T[]; total: number }> {
    const payload = await this.http.get<unknown>("/admin/departments", {
      query: { page: 1, limit: 20, status: "active", ...params },
    });
    const normalized = normalizePagedResult<T>(payload);
    return { items: normalized.items, total: normalized.total };
  }

  async get<T = unknown>(id: string): Promise<T> {
    return getData<T>(this.http, `/admin/departments/${id}`);
  }

  async create<T = unknown>(body: Record<string, unknown>): Promise<T> {
    return postData<T>(this.http, "/admin/departments", body);
  }

  async update<T = unknown>(id: string, body: Record<string, unknown>): Promise<T> {
    return putData<T>(this.http, `/admin/departments/${id}`, body);
  }

  async remove(id: string): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/departments/${id}`);
  }

  async restore<T = unknown>(id: string): Promise<T> {
    return postData<T>(this.http, `/admin/departments/${id}/restore`);
  }

  async purge(id: string): Promise<void> {
    await deleteData<unknown>(this.http, `/admin/departments/${id}/hard-delete`);
  }

  async bulk(body: { action: string; ids: string[] }): Promise<void> {
    await postData<unknown>(this.http, "/admin/departments/bulk", body);
  }
}
