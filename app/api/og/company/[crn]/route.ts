/**
 * /api/og/company/{crn} — 动态 OG 分享图（SVG 公司名卡片，1200×630）
 *
 * 说明：部分平台（X/Twitter）不支持 SVG og:image，Facebook/多数 IM 可用；
 * 如需 PNG 可后续用 sharp 渲染（当前零依赖优先 SVG）。
 */
import { NextResponse, type NextRequest } from "next/server";
import { getCompanyByCrn } from "@/lib/companies-house";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 截断到最大字符数 */
function clip(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ crn: string }> }
) {
  const { crn } = await params;
  let name = "";
  let status = "";
  try {
    const c = await getCompanyByCrn(crn);
    name = c.company_name;
    status = c.company_status;
  } catch {
    // 数据缺失时仍输出通用卡片（不影响页面本身）
  }
  const title = esc(clip(name || "Company Record", 44));
  const sub = name
    ? esc(`CRN ${crn}  ·  ${status || "Unknown"}`)
    : esc(`CRN ${crn}`);
  const domain = esc(siteConfig.domain || "qxx.uk");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff" opacity="0.9">${domain}</text>
  <rect x="180" y="230" width="840" height="4" rx="2" fill="#93c5fd"/>
  <text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#ffffff">${title}</text>
  <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#bfdbfe">${sub}</text>
  <text x="600" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#93c5fd">Official Companies House data · Free verification</text>
</svg>
`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "CDN-Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}