/**
 * /sitemaps/company/{vol} — 公司号按前缀分卷（标准动态段）
 *
 * vol ∈ digits-{00..99}（纯数字按前 2 位）、prefix-{SC,NI,…}（19 种前缀）、other。
 * 数据源见 lib/sitemap-repo.ts（CH_SITEMAP_DB / CH_SITEMAP_DB_URL / 种子回退）。
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  companiesForVolume,
  parseVolume,
  sitemapXmlHeaders,
} from "@/lib/sitemap-repo";
import { buildUrlsetXml } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vol: string }> }
) {
  const { vol } = await params;
  if (!parseVolume(vol)) {
    return new NextResponse(null, { status: 404 });
  }
  const hits = await companiesForVolume(vol);
  return new NextResponse(buildUrlsetXml(hits), { headers: sitemapXmlHeaders() });
}