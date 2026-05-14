import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Cho phép `next/image` tối ưu ảnh từ domain HUB (có thể bỏ `unoptimized` từng bước sau QA). */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fileserver2.hub.edu.vn", pathname: "/**" },
      { protocol: "https", hostname: "hub.edu.vn", pathname: "/**" },
    ],
  },
  transpilePackages: [
    "@ui",
    "@workspace/api-client",
    "@workspace/query-client",
    "@thangph2146/lexical-editor",
  ],
};

export default nextConfig;
