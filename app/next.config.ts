import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@tavsin/sdk"],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
