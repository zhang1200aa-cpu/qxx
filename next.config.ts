import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 输出 standalone 构建，便于 VPS / Docker 部署
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: false,
  // 可选 PG 依赖不参与构建期打包：构建时跳过解析，运行期由 Node 原生 require 加载
  //（未安装 pg 时相关功能在运行时优雅降级：本地库回源官方 API、sitemap 回退种子数据）
  serverExternalPackages: ["pg"],

  // CDN / 浏览器缓存响应头
  // 说明：header 会同时下发 Cache-Control 与 CDN-Cache-Control，
  // Cloudflare 优先读取 CDN-Cache-Control（不随 HTML 渲染逻辑被 Next 覆盖）。
  async headers() {
    return [
      {
        // 静态资源：文件名均带内容 hash，一旦上线便不可变，长缓存 1 年 + immutable
        // 可显著降低 Googlebot 抓取静态资源导致的源站/回源请求与缓存未命中。
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 公司详情页 /company/[crn]（App Router 下该路由为 dynamic）：
        //  - 浏览器侧 max-age=0, must-revalidate：每次回源校验，不产生私有无意缓存
        //  - CDN 层 s-maxage=86400：边缘缓存 1 天；过期后在后台续期并最多再供旧内容 7 天
        //    （stale-while-revalidate=604800），把 Googlebot 的重复抓取挡在 CDN 层。
        //  - stale-if-error=86400：源站故障（超时/5xx）时 CDN 继续供旧内容 1 天兜底。
        source: "/company/:crn",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=86400",
          },
          {
            key: "CDN-Cache-Control",
            value:
              "public, max-age=0, must-revalidate, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=86400",
          },
        ],
      },
      {
        // VAT 详情页：HMRC 结果 7 天缓存（本库缓存 TTL 也为 7 天），CDN 挡重复校验
        source: "/vat/:vrn",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=0, s-maxage=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // 邮编详情页：ONS 数据低频变化，CDN 缓存 1 天
        source: "/postcode/:code",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // 页面级 404（notFound() 触发的 /_not-found）：确定性结果，让 CDN 缓存 1 小时
        source: "/_not-found",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=300, s-maxage=3600",
          },
        ],
      },
      {
        // public/logo, /images 下的品牌图形（内容长期不变，文件名变更即新 URL）
        source: "/logo/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        // public/ 下的图标/图片（内容长期不变，文件名变更即新 URL）
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
      {
        // 全局安全响应头（CSP 谨慎：AdSense/Cookie-Script 需豁免，暂不引入以免误伤）
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
