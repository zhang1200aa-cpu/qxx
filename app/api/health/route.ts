/**
 * GET /api/health — 服务健康检查（uptime / 缓存后端 / 上游状态）
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    ok: true,
    service: "qxx.uk",
    time: new Date().toISOString(),
    cacheProvider: process.env.REDIS_URL ? "redis" : "memory",
    upstreams: {
      companiesHouse: Boolean(process.env.COMPANIES_HOUSE_API_KEY)
        ? `configured (env: ${
            process.env.COMPANIES_HOUSE_ENV === "sandbox" ? "sandbox" : "production"
          })`
        : "missing-key",
      hmrc: "public-endpoint",
      postcodesIo: "public-endpoint",
    },
  };
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}