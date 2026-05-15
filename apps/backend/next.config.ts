import type { NextConfig } from "next";

function normalizeBasePath(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const withSlash = v.startsWith("/") ? v : `/${v}`;
  return withSlash.replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BACKEND_BASE_PATH);

// Optional: run admin under a trailingSlash production
// Set NEXT_PUBLIC_TRAILING_SLASH=true in .env to enable trailing slashes for all routes
const trailingSlash = process.env.NEXT_PUBLIC_TRAILING_SLASH === "true";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  trailingSlash,
  transpilePackages: [
    "@ui",
    "@workspace/api-client",
    "@workspace/query-client",
    "@thangph2146/lexical-editor",
  ],
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
