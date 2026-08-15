/**
 * robots.txt — 搜索抓取规则
 * 仅屏蔽数据 API 端点；/api-docs、/about、/privacy、/terms、/contact 均允许索引
 */
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/search?*"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}