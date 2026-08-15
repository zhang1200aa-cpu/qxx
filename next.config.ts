import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 输出 standalone 构建，便于 VPS / Docker 部署
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: false,
};

export default nextConfig;
