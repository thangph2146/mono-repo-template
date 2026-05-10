/**
 * Tiny, dependency-free HTTP client used by every consumer of the @api
 * service. Wraps `fetch` so we can centralise auth headers, timeouts, error
 * shaping, and JSON parsing once and re-use it everywhere.
 */

import {
  buildDevLogResponseJson,
  formatDevApiStateHint,
  formatDevRequestBody,
  formatDevResponsePayload,
  printDevApiCall,
  printDevApiNetworkError,
} from './dev-log-format';

function readNodeEnv(): string | undefined {
  // Node / SSR: process.env có sẵn. Browser: nhiều bundler (Next, Vite) vẫn thay
  // `process.env.NODE_ENV` bằng literal; globalThis.process thường không tồn tại.
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  const proc = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process;
  return proc?.env?.NODE_ENV;
}

function defaultDevLogging(options: ApiClientOptions): boolean {
  if (options.devLogging === false) return false;
  if (options.devLogging === true) return true;
  return readNodeEnv() === 'development';
}

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
  /**
   * Khi true (mặc định nếu `NODE_ENV === "development"`), ghi ra console
   * method, path, status và thời gian — tiện theo dõi app gọi API.
   */
  devLogging?: boolean;
  /** Tiền tố log (vd: `storesync-admin`) để phân biệt app trong monorepo. */
  devLogTag?: string;
  /**
   * Chuỗi hoặc object mô tả user/role gửi kèm mỗi dòng log dev (không dùng cho secrets).
   */
  getDevAuthContext?: () =>
    | string
    | Record<string, unknown>
    | null
    | undefined
    | Promise<
        string | Record<string, unknown> | null | undefined
      >;
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
  private readonly devLogging: boolean;
  private readonly devLogTag: string;
  private readonly getDevAuthContext?: ApiClientOptions['getDevAuthContext'];

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.headers ?? {};
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.getAuthToken = options.getAuthToken;
    this.getUserId = options.getUserId;
    this.devLogging = defaultDevLogging(options);
    this.devLogTag = options.devLogTag ?? 'api-client';
    this.getDevAuthContext = options.getDevAuthContext;
  }

  private async formatDevAuthSuffix(): Promise<string> {
    if (!this.getDevAuthContext) return '';
    try {
      const ctx = await this.getDevAuthContext();
      if (ctx === null || ctx === undefined || ctx === '') return '';
      const text = typeof ctx === 'string' ? ctx : JSON.stringify(ctx);
      return ` | auth: ${text}`;
    } catch {
      return ' | auth: ?';
    }
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

    const t0 =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

    const authSuffix = this.devLogging ? await this.formatDevAuthSuffix() : '';
    const reqBodyLog =
      this.devLogging && body !== undefined
        ? formatDevRequestBody(body)
        : undefined;

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
    } catch (err) {
      if (this.devLogging) {
        const ms =
          (typeof performance !== 'undefined' &&
          typeof performance.now === 'function'
            ? performance.now()
            : Date.now()) - t0;
        printDevApiNetworkError({
          tag: this.devLogTag,
          method,
          path,
          ms,
          authSuffix,
          err,
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) {
      if (this.devLogging) {
        const ms =
          (typeof performance !== 'undefined' &&
          typeof performance.now === 'function'
            ? performance.now()
            : Date.now()) - t0;
        printDevApiCall({
          tag: this.devLogTag,
          method,
          path,
          status: 204,
          ms,
          reqBodyText: reqBodyLog,
          authSuffix,
          respSummary: '204 — không có body',
        });
      }
      return undefined as T;
    }

    const isJson = (response.headers.get('content-type') ?? '').includes(
      'application/json',
    );
    const payload: unknown = isJson
      ? await response.json().catch(() => null)
      : await response.text().catch(() => null);

    if (this.devLogging) {
      const ms =
        (typeof performance !== 'undefined' &&
        typeof performance.now === 'function'
          ? performance.now()
          : Date.now()) - t0;
      const respSummary = formatDevResponsePayload(
        response.status,
        payload,
        response.ok,
      );
      const stateHint = formatDevApiStateHint(path, method, payload, response.ok);
      const responseJson = buildDevLogResponseJson(path, response.ok, payload);
      printDevApiCall({
        tag: this.devLogTag,
        method,
        path,
        status: response.status,
        ms,
        reqBodyText: reqBodyLog,
        authSuffix,
        respSummary,
        stateHint,
        responseJson,
      });
    }

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
