const DEFAULT_ADMIN_URL = "http://localhost:3001";
const ADMIN_LOGIN_SEGMENT = "/admin/login";
const ADMIN_REGISTER_SEGMENT = "/admin/register";

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

export function getAdminLoginUrl() {
  return buildAdminUrl(ADMIN_LOGIN_SEGMENT);
}

export function getAdminRegisterUrl() {
  return buildAdminUrl(ADMIN_REGISTER_SEGMENT);
}
