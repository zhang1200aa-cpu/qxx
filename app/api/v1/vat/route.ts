/**
 * GET /api/v1/vat?vat=123456789
 * VAT 验证接口（HMRC 官方数据，结果缓存 7 天）
 *
 * 鉴权：免费匿名 IP 限流；付费 x-api-key
 */
import type { NextRequest } from "next/server";
import { checkVatNumber, HmrcError } from "@/lib/hmrc-vat";
import { authorizeRequest } from "@/lib/api-auth";
import { ok, fail, corsPreflight } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CORS 预检：App Router 需要单独导出 OPTIONS 处理器才能响应 Preflight */
export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {
  const vat = req.nextUrl.searchParams.get("vat") ?? "";

  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return fail(auth.status, auth.code, auth.message);
  }

  try {
    const result = await checkVatNumber(vat);
    return ok(result, {
      cached: false,
      source: "hmrc",
      plan: auth.auth.planId,
      highPriority: auth.auth.highPriority,
      remaining: auth.auth.remaining ?? undefined,
    });
  } catch (err) {
    if (err instanceof HmrcError) {
      return fail(err.status, "hmrc_error", err.message);
    }
    console.error("[api/vat]", err);
    return fail(500, "internal_error", "Unexpected error while querying HMRC.");
  }
}