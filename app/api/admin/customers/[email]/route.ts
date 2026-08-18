/**
 * /api/admin/customers/[email] — 客户详情与操作（仅管理员）
 *   GET                                  → MemberProfile
 *   PATCH { plan?, status?, credits?, alertsEnabled?, apiKeyAction? }
 *     apiKeyAction: "issue" | "reset" | "revoke"
 *   DELETE ?purge=acct|all                 → 可选：清账户（预留，暂仅 acct）
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, AuthRequiredError } from "@/lib/auth";
import { getMemberProfile } from "@/lib/registry";
import {
  upsertAccount,
  issueApiKey,
  revokeApiKey,
  setAccountStatus,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { PLANS, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ email: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const { email } = await params;
  const profile = await getMemberProfile(decodeURIComponent(email));
  if (!profile) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: profile });
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }
  const { email } = await params;
  const e = decodeURIComponent(email).toLowerCase();

  let body: {
    plan?: string;
    status?: string;
    credits?: number;
    alertsEnabled?: boolean;
    apiKeyAction?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  // 改套餐（仅允许合法 PlanId）
  if (body.plan !== undefined) {
    const plan = body.plan as PlanId;
    if (!(plan in PLANS)) {
      return NextResponse.json({ success: false, error: "Invalid plan." }, { status: 400 });
    }
    await upsertAccount(e, { plan });
  }
  // 停用 / 恢复
  if (body.status !== undefined) {
    const status = body.status as SubscriptionStatus;
    if (!["active", "trialing", "cancelled", "expired"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status." }, { status: 400 });
    }
    await setAccountStatus(e, status);
  }
  // 调整报告点数
  if (body.credits !== undefined) {
    if (!Number.isFinite(body.credits) || body.credits < 0) {
      return NextResponse.json({ success: false, error: "Invalid credits." }, { status: 400 });
    }
    await upsertAccount(e, { credits: Math.floor(body.credits) });
  }
  // 提醒开关
  if (body.alertsEnabled !== undefined) {
    await upsertAccount(e, { alertsEnabled: Boolean(body.alertsEnabled) });
  }
  // API Key 动作
  let issuedKey: string | null = null;
  if (body.apiKeyAction) {
    if (body.apiKeyAction === "revoke") {
      await revokeApiKey(e);
    } else if (body.apiKeyAction === "reset" || body.apiKeyAction === "issue") {
      issuedKey = await issueApiKey(e, { reset: body.apiKeyAction === "reset" });
    } else {
      return NextResponse.json({ success: false, error: "Invalid apiKeyAction." }, { status: 400 });
    }
  }

  const profile = await getMemberProfile(e);
  return NextResponse.json({
    success: true,
    data: { profile, issuedApiKey: issuedKey },
  });
}