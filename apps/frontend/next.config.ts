import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: [
    "@ui",
    "@workspace/api-client",
    "@thangph2146/lexical-editor",
  ],
};

export default nextConfig;
