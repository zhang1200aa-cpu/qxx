/**
 * /sitemap.xml — Sitemap Index（分卷入口）
 *
 * 子卷：
 *   /sitemap-static.xml
 *   /sitemaps/company/{digits-00..99 | prefix-sc/.. | other}
 *
 * 每卷公司数量由 lib/sitemap-repo.ts 的 MAX_PER_VOLUME=50,000 兜住 Google 单文件限制。
 */
import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/lib/site";
import { VOLUMES, sitemapXmlHeaders } from "@/lib/sitemap-repo";
import { buildIndexXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  const base = siteConfig.url;
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    { loc: `${base}/sitemap-static.xml`, lastmod: today },
    ...VOLUMES.map((v) => ({ loc: `${base}/sitemaps/company/${v}`, lastmod: today })),
  ];
  return new NextResponse(buildIndexXml(entries), { headers: sitemapXmlHeaders() });
}