/**
 * GET /api/search?q=tes   → 毫秒级公司名/CRN 前缀补全（Top 8，供前端下拉框）
 *
 * 说明：
 *   - 未配置 Meilisearch 时返回空 + configured:false，前端不渲染下拉（保持既有行为）
 *   - 前端用 debounce(150ms) 调用，输入 ≥2 字符触发
 *   - 响应结构轻量，仅供 Autocomplete；完整搜索页 /search 仍走 Companies House 官方搜索
 */
import { NextResponse, type NextRequest } from "next/server";
import { searchAutocomplete } from "@/lib/meilisearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  const rawLimit = Number(req.nextUrl.searchParams.get("limit") || 8);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 8, 1), 20);

  if (q.length < 2) {
    return NextResponse.json(
      { success: true, data: { query: q, items: [], configured: true } },
      { status: 200 }
    );
  }

  try {
    const result = await searchAutocomplete(q, { limit });
    return NextResponse.json({
      success: true,
      data: {
        query: q,
        configured: result.configured,
        total: result.total,
        items: result.hits.map((h) => ({
          company_number: h.company_number,
          company_name: h.company_name,
          company_status: h.company_status ?? null,
          company_category: h.company_category ?? null,
          highlighted: h._formatted?.company_name ?? h.company_name,
          url: `/company/${h.company_number}`,
        })),
      },
    });
  } catch (err) {
    console.error("[api/search]", err);
    return NextResponse.json(
      { success: false, error: "Search backend unavailable." },
      { status: 500 }
    );
  }
}