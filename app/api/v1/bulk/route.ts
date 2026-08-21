/**
 * POST /api/v1/bulk
 *
 * 批量查询（会计 Pro / 风控 / 销售获客核心功能）
 * body: { "type": "company" | "vat" | "postcode", "items": ["02050399", "..."], "email"?: string }
 *
 * 配额：免费 ≤5 行/次；付费按套餐行数上限（accountant-pro 5,000 行/次）
 * 免费每日总行数上限 50；付费 100,000
 */
import type { NextRequest } from "next/server";
import { getCompanyByCrn, CompaniesHouseError } from "@/lib/companies-house";
import { checkVatNumber, HmrcError } from "@/lib/hmrc-vat";
import { lookupPostcode, PostcodeError } from "@/lib/postcodes";
import { authorizeBulk } from "@/lib/subscription";
import { authorizeRequest } from "@/lib/api-auth";
import { ok, fail, corsPreflight } from "@/lib/api";
import type { PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type BulkType = "company" | "vat" | "postcode";

/** CORS 预检：App Router 需要独立导出 OPTIONS 处理器才能响应 Preflight */
export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {

  let body: { type?: BulkType; items?: string[] };
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request", "Invalid JSON body.");
  }

  const type = body.type ?? "company";
  const items = (body.items ?? [])
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, 10_000);

  if (!["company", "vat", "postcode"].includes(type)) {
    return fail(400, "bad_request", "type must be 'company' | 'vat' | 'postcode'.");
  }
  if (items.length === 0) {
    return fail(400, "bad_request", "items array is empty.");
  }

  // 统一鉴权：游客 IP 限流 / 会员每日网页额度 / 订阅 x-api-key 月度配额，
  // 并在此拦截无效 key(401)、已取消/过期订阅(402) 与超限(429)。
  const auth = await authorizeRequest(req);
  if (!auth.ok) {
    return fail(auth.status, auth.code, auth.message);
  }

  const authInfo = auth.auth;

  // 计划判定：x-api-key 账户 > 登录层级 > 游客
  const planId: PlanId = authInfo.planId;

  const quota = await authorizeBulk(planId, items.length);
  if (!quota.allowed) {
    return fail(429, "bulk_limit", quota.reason ?? "Bulk limit exceeded.");
  }

  const results: unknown[] = [];
  const errors: { input: string; error: string }[] = [];

  // 串行 + 复用缓存，避免冲击官方限频
  for (const item of items) {
    try {
      if (type === "company") {
        results.push({ input: item, data: await getCompanyByCrn(item) });
      } else if (type === "vat") {
        results.push({ input: item, data: await checkVatNumber(item) });
      } else {
        results.push({ input: item, data: await lookupPostcode(item) });
      }
    } catch (err) {
      const message =
        err instanceof CompaniesHouseError ||
        err instanceof HmrcError ||
        err instanceof PostcodeError
          ? err.message
          : "Lookup failed.";
      errors.push({ input: item, error: message });
    }
  }

  return ok(
    { type, requested: items.length, results, errors },
    {
      cached: false,
      plan: planId,
      remaining: quota.remaining,
      exceptionCount: errors.length,
    }
  );
}