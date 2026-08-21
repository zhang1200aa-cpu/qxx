/**
 * GET /api/v1/company?crn=02050399 或 ?q=company+name
 *
 * 鉴权：
 *   - 免费匿名：每 IP 60 次/分（单次查询足够）
 *   - 付费：请求头 x-api-key（$9.99/月 10,000 次）
 */
import type { NextRequest } from "next/server";
import {
  getCompanyByCrn,
  searchCompanies,
  CompaniesHouseError,
} from "@/lib/companies-house";
import { authorizeRequest } from "@/lib/api-auth";
import { ok, fail, corsPreflight } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CORS 预检：App Router 需要独立导出 OPTIONS 处理器才能响应 Preflight */
export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {

  const { searchParams } = req.nextUrl;
  const crn = searchParams.get("crn") ?? "";
  const q = searchParams.get("q") ?? "";

  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return fail(auth.status, auth.code, auth.message);
  }

  try {
    let data: unknown;
    let kind: "company" | "search";
    if (crn) {
      data = await getCompanyByCrn(crn);
      kind = "company";
    } else if (q) {
      data = await searchCompanies(q);
      kind = "search";
    } else {
      return fail(400, "bad_request", "Provide either 'crn' or 'q' query parameter.");
    }
    return ok(data, {
      cached: false,
      source: "companies-house",
      plan: auth.auth.planId,
      highPriority: auth.auth.highPriority,
      remaining: auth.auth.remaining ?? undefined,
      kind,
    });
  } catch (err) {
    if (err instanceof CompaniesHouseError) {
      return fail(err.status, "companies_house_error", err.message);
    }
    console.error("[api/company]", err);
    return fail(500, "internal_error", "Unexpected error while querying Companies House.");
  }
}
