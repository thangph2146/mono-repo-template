import { ApiError, type ApiClient } from "../client";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

type PagedApiShape<T> =
  | { data: T[]; pagination?: { total?: number } }
  | { items: T[]; total?: number };

export function unwrapApiEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  const envelope = payload as ApiEnvelope<T>;
  if (envelope.success === false) {
    throw new ApiError(400, "Bad Request", payload, envelope.message);
  }
  if ("data" in envelope) {
    return envelope.data as T;
  }
  return payload as T;
}

export function normalizePagedResult<T>(
  payload: unknown,
): { items: T[]; total: number } {
  const data = unwrapApiEnvelope<PagedApiShape<T>>(payload);

  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }

  if (data && typeof data === "object") {
    if ("items" in data && Array.isArray(data.items)) {
      return {
        items: data.items,
        total: typeof data.total === "number" ? data.total : data.items.length,
      };
    }
    if ("data" in data && Array.isArray(data.data)) {
      const total =
        typeof data.pagination?.total === "number"
          ? data.pagination.total
          : data.data.length;
      return { items: data.data, total };
    }
  }

  return { items: [], total: 0 };
}

export async function getData<T>(
  http: ApiClient,
  path: string,
  options?: Parameters<ApiClient["get"]>[1],
): Promise<T> {
  const payload = await http.get<unknown>(path, options);
  return unwrapApiEnvelope<T>(payload);
}

export async function postData<T>(
  http: ApiClient,
  path: string,
  body?: unknown,
  options?: Parameters<ApiClient["post"]>[2],
): Promise<T> {
  const payload = await http.post<unknown>(path, body, options);
  return unwrapApiEnvelope<T>(payload);
}

export async function putData<T>(
  http: ApiClient,
  path: string,
  body?: unknown,
  options?: Parameters<ApiClient["put"]>[2],
): Promise<T> {
  const payload = await http.put<unknown>(path, body, options);
  return unwrapApiEnvelope<T>(payload);
}

export async function deleteData<T>(
  http: ApiClient,
  path: string,
  options?: Parameters<ApiClient["delete"]>[1],
): Promise<T> {
  const payload = await http.delete<unknown>(path, options);
  return unwrapApiEnvelope<T>(payload);
}
