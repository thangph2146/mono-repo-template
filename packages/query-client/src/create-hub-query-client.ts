import { QueryClient, type DefaultOptions } from "@tanstack/react-query";

/**
 * Retry mặc định: không retry lỗi 4xx (duck-typing `status`, không phụ thuộc class ApiError từng app).
 */
export function hubDefaultQueryRetry(failureCount: number, error: unknown): boolean {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : Number.NaN;
  if (Number.isFinite(status) && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 2;
}

/** Cấu hình mặc định dùng chung cho @frontend và @backend. */
export const hubQueryClientDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 30_000,
    retry: hubDefaultQueryRetry,
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: false,
  },
};

export function createHubQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: hubQueryClientDefaultOptions,
  });
}
