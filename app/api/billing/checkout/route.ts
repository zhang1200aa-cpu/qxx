/**
 * GET /api/billing/checkout?plan=api-starter&email=user@example.com
 *
 * 收款渠道选择（环境变量控制）：
 *   1. Lemon Squeezy（默认推荐——对独立开发者最省事）
 *      - LEMONSQUEEZY_CHECKOUT_PREFIX + LEMONSQUEEZY_VARIANT_<PLAN>
 *      - 或配置 LEMONSQUEEZY_API_KEY 走官方 Checkout API 创建结账会话
 *   2. Stripe（备选——已有 Stripe 账户的团队）
 *      - NEXT_PUBLIC_STRIPE_PAYMENT_LINK_<PLAN> 使用 Stripe Payment Link
 *
 * 返回 JSON: { checkoutUrl, provider, plan }
 */
import { NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_IDS: PlanId[] = [
  "api-starter",
  "accountant-pro",
  "credit-pack",
  "lead-export",
];

function env(name: string): string {
  return process.env[name] ?? "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = (url.searchParams.get("plan") ?? "") as PlanId;
  const email = (url.searchParams.get("email") ?? "").trim();

  if (!PLAN_IDS.includes(plan)) {
    return NextResponse.json(
      { success: false, error: { code: "bad_plan", message: `Unknown plan: ${plan}` } },
      { status: 400 }
    );
  }

  // ---- Channel 1: Lemon Squeezy ----
  const lsVariant = env(`LEMONSQUEEZY_VARIANT_${plan.toUpperCase().replace("-", "_")}`);
  const lsPrefix = env("LEMONSQUEEZY_CHECKOUT_PREFIX");
  const lsApiKey = env("LEMONSQUEEZY_API_KEY");
  const lsStore = env("LEMONSQUEEZY_STORE_ID");

  if (lsPrefix && lsVariant) {
    const checkoutUrl = `${lsPrefix}/buy/${lsVariant}${
      email ? `?checkout[email]=${encodeURIComponent(email)}` : ""
    }`;
    return NextResponse.json({
      success: true,
      checkoutUrl,
      provider: "lemon-squeezy",
      plan,
      priceUsd: PLANS[plan].priceUsd,
    });
  }

  // 可用 API 动态创建结账会话（需要 LEMONSQUEEZY_API_KEY）
  if (lsApiKey && lsStore && lsVariant) {
    try {
      const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lsApiKey}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: email || undefined,
              },
            },
            relationships: {
              store: { data: { type: "stores", id: lsStore } },
              variant: { data: { type: "variants", id: lsVariant } },
            },
          },
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as {
          data?: { attributes?: { url?: string } };
        };
        const checkoutUrl = body.data?.attributes?.url;
        if (checkoutUrl) {
          return NextResponse.json({
            success: true,
            checkoutUrl,
            provider: "lemon-squeezy",
            plan,
            priceUsd: PLANS[plan].priceUsd,
          });
        }
      }
      // 回退固定链接
      const fallback = `${lsPrefix}/buy/${lsVariant}`;
      return NextResponse.json({ success: true, checkoutUrl: fallback, provider: "lemon-squeezy", plan });
    } catch {
      // 继续向下走
    }
  }

  // ---- Channel 2: Stripe Payment Link ----
  const stripeLink = env(`NEXT_PUBLIC_STRIPE_PAYMENT_LINK_${plan.toUpperCase().replace("-", "_")}`);
  if (stripeLink) {
    const checkoutUrl = `${stripeLink}${email ? `?prefilled_email=${encodeURIComponent(email)}` : ""}`;
    return NextResponse.json({ success: true, checkoutUrl, provider: "stripe", plan });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "provider_not_configured",
        message:
          "Billing provider is not configured yet. Set LEMONSQUEEZY_CHECKOUT_PREFIX + LEMONSQUEEZY_VARIANT_<PLAN> (or Stripe payment links) — see docs/monetization.md.",
      },
    },
    { status: 501 }
  );
}