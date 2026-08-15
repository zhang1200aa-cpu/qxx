/**
 * GET /api/me — 当前用户信息与额度（账户/关注页共用）
 * 游客也返回 200（tier: guest），前端据此决定显示注册引导还是个人面板。
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  MEMBER_DAILY_API,
  SUBSCRIBER_DAILY_WEB_API,
} from "@/lib/api-auth";
import { getCache } from "@/lib/cache";
import { PLANS } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const cache = getCache();
  const day = new Date().toISOString().slice(0, 10);

  let dailyUsed = 0;
  if (user.tier !== "guest") {
    dailyUsed =
      (await cache.get<number>(`usage:webapi:${user.id}:${day}`)) ?? 0;
  }

  const dailyCap =
    user.tier === "subscriber"
      ? SUBSCRIBER_DAILY_WEB_API
      : user.tier === "member"
        ? MEMBER_DAILY_API
        : 0;

  // 账户信息（订阅）
  const subscription = user.subscription
    ? {
        email: user.subscription.email,
        planId: user.subscription.plan,
        planName: PLANS[user.subscription.plan]?.name ?? user.subscription.plan,
        credits: user.subscription.credits,
        status: user.subscription.status,
        apiKey: user.subscription.apiKey ? "••••••••" : null,
        hasApiKey: Boolean(user.subscription.apiKey),
      }
    : null;

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        planId: user.planId,
        isDemo: user.isDemo,
      },
      quota: {
        dailyUsed,
        dailyCap,
        dailyRemaining: user.tier === "guest" ? null : Math.max(0, dailyCap - dailyUsed),
      },
      subscription,
      authProvider:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.CLERK_SECRET_KEY
          ? "clerk"
          : "demo-or-guest",
    },
  });
}