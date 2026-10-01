import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ["@cardfit/engine"],
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
