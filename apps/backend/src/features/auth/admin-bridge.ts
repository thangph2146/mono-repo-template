import type { AuthUser } from "@workspace/api-client";

const DEFAULT_ADMIN_URL = "http://localhost:3001";
const ADMIN_LOGIN_SEGMENT = "/admin/login";

export function getAdminBaseUrl() {
  return (process.env.NEXT_PUBLIC_ADMIN_URL ?? DEFAULT_ADMIN_URL).replace(/\/$/, "");
}

function buildAdminUrl(pathname: string) {
  const baseUrl = getAdminBaseUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (baseUrl.endsWith("/admin") && normalizedPath.startsWith("/admin/")) {
    return `${baseUrl}${normalizedPath.slice("/admin".length)}`;
  }

  return `${baseUrl}${normalizedPath}`;
}

function encodeUtf8Base64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

export function buildAdminBridgeLoginUrl(user: AuthUser) {
  const payload = encodeUtf8Base64(JSON.stringify(user));
  return `${buildAdminUrl(ADMIN_LOGIN_SEGMENT)}#session=${encodeURIComponent(payload)}`;
}

export function getAdminLoginUrl() {
  return buildAdminUrl(ADMIN_LOGIN_SEGMENT);
}
