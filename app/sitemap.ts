/**
 * sitemap.xml — 动态生成
 * 首页/工具页 + 种子热门公司/邮编（上线后建议换成数据库驱动）
 */
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { POPULAR_COMPANIES, POPULAR_POSTCODES } from "@/lib/seed";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/vat`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/postcode`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/api-docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const companies: MetadataRoute.Sitemap = POPULAR_COMPANIES.map((c) => ({
    url: `${base}/company/${c.crn}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const postcodes: MetadataRoute.Sitemap = POPULAR_POSTCODES.map((p) => ({
    url: `${base}/postcode/${p.postcode.replace(/\s+/g, "")}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...companies, ...postcodes];
}