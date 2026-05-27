import type { AuthUser } from "@workspace/api-client";
import { DEFAULT_API_URL } from "@workspace/api-client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  error?: string | null;
  data?: T;
};

export type AuthLoginPayload = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  permissions: string[];
  roles: Array<{ id: string; name: string; displayName: string }>;
};

export type RegisterRequestPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
};

export type RegisterLeadPayload = {
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  program?: string;
  major?: string;
  subscribeNewsletter?: boolean;
  subscribeConsultation?: boolean;
  content?: string;
};

export type DevLoginOption = {
  id: string;
  email: string;
  name: string | null;
  roleNames: string[];
  roleLabels: string[];
  description: string;
};

function normalizePermissionValues(value: unknown): string[] {
  const visit = (input: unknown): string[] => {
    if (Array.isArray(input)) {
      return input.flatMap((item) => visit(item));
    }
    if (typeof input !== "string") {
      return [];
    }

    const trimmed = input.trim();
    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
      try {
        return visit(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  };

  return [...new Set(visit(value))];
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

function buildApiUrl(pathname: string) {
  return `${getApiBaseUrl()}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

async function postApi<TResponse, TBody>(pathname: string, body: TBody) {
  const url = buildApiUrl(pathname);
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log(`[frontend][api] POST ${url}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<TResponse> | null;

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

async function getApi<TResponse>(pathname: string) {
  const url = buildApiUrl(pathname);
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    console.log(`[frontend][api] GET ${url}`);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<TResponse> | null;

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

export function loginWithEmail(body: { email: string; password: string }) {
  return postApi<AuthLoginPayload, { email: string; password: string }>(
    "/auth/admin/login",
    body,
  );
}

export function loginWithGoogle(credential: string) {
  return postApi<AuthLoginPayload, { credential: string }>(
    "/auth/admin/google",
    { credential },
  );
}

export function fetchGoogleOAuthConfig() {
  return getApi<{ clientId: string }>("/auth/admin/google/config");
}

export function loginWithDevelopmentUser(body: { userId: string }) {
  return postApi<AuthLoginPayload, { userId: string }>(
    "/auth/admin/dev-login",
    body,
  );
}

export function toAdminSessionUser(payload: AuthLoginPayload): AuthUser {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name?.trim() || payload.email,
    image: payload.image,
    phone: null,
    address: null,
    roles: payload.roles,
    permissions: normalizePermissionValues(payload.permissions),
  };
}

export function registerAccount(body: RegisterRequestPayload) {
  return postApi<AuthLoginPayload, RegisterRequestPayload>("/public/register", body);
}

export function submitRegisterRequest(body: RegisterLeadPayload) {
  return postApi<{ id: string; message: string }, RegisterLeadPayload>(
    "/public/contact-requests",
    body,
  );
}

export async function fetchDevLoginOptions() {
  if (process.env.NODE_ENV !== "development") {
    return [] as DevLoginOption[];
  }

  try {
    return await getApi<DevLoginOption[]>("/public/dev-login-options");
  } catch {
    return [];
  }
}
