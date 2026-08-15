/**
 * GET /api/v1/postcode?postcode=SW1A+1AA
 * 邮编查询接口（Postcodes.io / ONS 数据，缓存 30 天）
 *
 * 鉴权：免费匿名 IP 限流；付费 x-api-key
 */
import type { NextRequest } from "next/server";
import { lookupPostcode, PostcodeError } from "@/lib/postcodes";
import { authorizeRequest } from "@/lib/api-auth";
import { ok, fail, corsPreflight } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.method === "OPTIONS") return corsPreflight();

  const postcode = req.nextUrl.searchParams.get("postcode") ?? "";

  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return fail(auth.status, auth.code, auth.message);
  }

  try {
    const result = await lookupPostcode(postcode);
    return ok(result, {
      cached: false,
      source: "postcodes-io",
      plan: auth.auth.planId,
      highPriority: auth.auth.highPriority,
      remaining: auth.auth.remaining ?? undefined,
    });
  } catch (err) {
    if (err instanceof PostcodeError) {
      return fail(err.status, "postcode_error", err.message);
    }
    console.error("[api/postcode]", err);
    return fail(500, "internal_error", "Unexpected error while querying postcodes.io.");
  }
}