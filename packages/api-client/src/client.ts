/**
 * Tiny, dependency-free HTTP client used by every consumer of the @api
 * service. Wraps `fetch` so we can centralise auth headers, timeouts, error
 * shaping, and JSON parsing once and re-use it everywhere.
 */

export interface ApiClientOptions {
  /** Base URL of the API, including the global prefix (e.g. http://localhost:3002/api). */
  baseUrl: string;
  /** Static headers attached to every request. */
  headers?: Record<string, string>;
  /** Lazily-resolved auth token (called per request). */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** User id hiện tại — gửi `X-User-Id` (RBAC trên API). */
  getUserId?: () =>
    | string
    | number
    | null
    | undefined
    | Promise<string | number | null | undefined>;
  /** Default timeout in milliseconds. Defaults to 15s. */
  timeoutMs?: number;
  /** Custom fetch implementation (e.g. for SSR / Node 18 stubs). */
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

const buildUrl = (
  baseUrl: string,
  path: string,
  query?: RequestOptions['query'],
) => {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${trimmedBase}${trimmedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly getAuthToken?: ApiClientOptions['getAuthToken'];
  private readonly getUserId?: ApiClientOptions['getUserId'];

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.getAuthToken = options.getAuthToken;
    this.getUserId = options.getUserId;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = buildUrl(this.baseUrl, path, options?.query);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...(options?.headers ?? {}),
    };

    const token = this.getAuthToken ? await this.getAuthToken() : undefined;
    if (token) headers.Authorization = `Bearer ${token}`;

    const userId = this.getUserId ? await this.getUserId() : undefined;
    if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
      headers['X-User-Id'] = String(userId).trim();
    }

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? this.timeoutMs;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }

    let response: Response;
    try {
      response = await this.fetcher(url, {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const isJson = (response.headers.get('content-type') ?? '').includes(
      'application/json',
    );
    const payload: unknown = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        payload,
        extractMessage(payload) ?? `${response.status} ${response.statusText}`,
      );
    }

    return payload as T;
  }
}

const extractMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string') return record.message;
  if (Array.isArray(record.message)) return record.message.join(', ');
  return undefined;
};
