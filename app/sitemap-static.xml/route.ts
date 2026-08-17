/**
 * /sitemap-static.xml — 静态工具页 + 邮编详情页（小量，不分卷）
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  staticPageHits,
  postcodeHits,
  sitemapXmlHeaders,
} from "@/lib/sitemap-repo";
import { buildUrlsetXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest) {
  const hits = [...staticPageHits(), ...postcodeHits()];
  return new NextResponse(buildUrlsetXml(hits), { headers: sitemapXmlHeaders() });
}