import { NextRequest, NextResponse } from "next/server";
import { queryGsc, GscError, last30Days } from "@/lib/gsc";

export const dynamic = "force-dynamic";

/**
 * GET /api/seo/analytics
 * 返回 qxx.uk 最近 28 天的搜索表现数据。
 * 认证：需要 GOOGLE_SEARCH_CONSOLE_API_KEY 或 GOOGLE_SEARCH_CONSOLE_TOKEN。
 */
export async function GET(request: NextRequest) {
  // 简单校验：生产环境要求 API Key 已配置，否则返回未配置提示
  const configured =
    Boolean(process.env.GOOGLE_SEARCH_CONSOLE_API_KEY) ||
    Boolean(process.env.GOOGLE_SEARCH_CONSOLE_TOKEN);

  if (!configured) {
    return NextResponse.json(
      {
        error: "GSC not configured",
        message:
          "Set GOOGLE_SEARCH_CONSOLE_API_KEY (or GOOGLE_SEARCH_CONSOLE_TOKEN) environment variable.",
      },
      { status: 501 }
    );
  }

  const { searchParams } = request.nextUrl;
  const dimensionParam = searchParams.get("dimensions") || "query";
  const rowLimit = Math.min(Number(searchParams.get("limit") || 20), 100);

  const validDimensions = ["query", "page", "country", "device", "date", "searchAppearance"];
  const dims = dimensionParam.split(",").filter((d) => validDimensions.includes(d));
  const dimensions = dims.length > 0 ? dims : ["query"];

  const { startDate, endDate } = last30Days();

  try {
    const data = await queryGsc(startDate, endDate, dimensions, rowLimit);
    return NextResponse.json({ success: true, startDate, endDate, ...data });
  } catch (err) {
    if (err instanceof GscError) {
      return NextResponse.json(
        { success: false, error: err.message, status: err.status },
        { status: err.status === 429 ? 429 : 500 }
      );
    }
    console.error("[seo/analytics]", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}