import { DEFAULT_API_URL } from "@workspace/api-client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PublicPostCategory = {
  category: {
    name: string;
    slug: string;
  };
};

type PublicPostTag = {
  tag: {
    name: string;
    slug: string;
  };
};

type PublicPostAuthor = {
  name: string | null;
  avatar?: string | null;
};

export type PublicPostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  eventStartAt?: string | null;
  eventEndAt?: string | null;
  author?: PublicPostAuthor | null;
  categories: PublicPostCategory[];
  tags: PublicPostTag[];
  viewCount: number;
};

export type PublicPostDetail = PublicPostSummary & {
  content?: unknown | null;
};

type PublicPostsPayload = {
  data: PublicPostSummary[];
  meta: PaginationMeta;
};

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

function buildApiUrl(pathname: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${getApiBaseUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function fetchPublicApi<T>(
  pathname: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = buildApiUrl(pathname, query);
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log(`[frontend][api] GET ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: isDev ? "no-store" : undefined,
    next: isDev ? undefined : { revalidate: 60 },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message =
      payload?.message ||
      payload?.error ||
      `Request failed: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  if (isDev) {
    console.log(`[frontend][api] ${response.status} ${pathname}`);
  }

  return payload.data;
}

export async function getPublicPosts(params?: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
}) {
  return fetchPublicApi<PublicPostsPayload>("/public/posts", params);
}

export async function getPublicPostBySlug(slug: string) {
  try {
    return await fetchPublicApi<PublicPostDetail>(`/public/posts/${slug}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not found/i.test(message)) return null;
    throw error;
  }
}

export function formatPostDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
