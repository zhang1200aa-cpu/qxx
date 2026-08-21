/**
 * API 统一响应格式与错误处理
 * 返回形如：
 *   { success: true, data: ..., cached: boolean, meta: {...} }
 *   { success: false, error: { code: string, message: string } }
 */
import { NextResponse } from "next/server";

export function ok<T>(data: T, extra?: { cached?: boolean; [k: string]: unknown }) {
  const { cached, ...rest } = extra ?? {};
  return NextResponse.json(
    {
      success: true,
      data,
      ...(cached !== undefined ? { cached } : {}),
      // 业务/响应级字段放在顶层（plan / highPriority / remaining / kind / exceptionCount ...），
      // 不再混入 meta，避免 meta 语义被污染
      ...rest,
      meta: {
        source: "qxx.uk",
        timestamp: new Date().toISOString(),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    {
      status,
      headers: { "Access-Control-Allow-Origin": "*" },
    }
  );
}

/** 从 NextRequest 里取客户端 IP（含 Cloudflare / Vercel 头） */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

/** CORS 预检 */
export function corsPreflight() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
      "Access-Control-Max-Age": "86400",
    },
  });
}