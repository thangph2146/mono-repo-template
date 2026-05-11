import type { NextConfig } from "next";

function normalizeBasePath(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  if (!v) return "";
  const withSlash = v.startsWith("/") ? v : `/${v}`;
  return withSlash.replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.BACKEND_BASE_PATH);

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@ui", "@workspace/api-client"],
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
