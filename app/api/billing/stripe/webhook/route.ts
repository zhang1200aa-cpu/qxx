/**
 * POST /api/billing/stripe/webhook
 *
 * Stripe webhook 接入点（备选渠道）
 *
 * 配置：
 *   STRIPE_WEBHOOK_SECRET = <Stripe Dashboard → Developers → Webhooks>
 * 在 Stripe 后台添加 endpoint，勾选事件：
 *   checkout.session.completed / customer.subscription.created
 *   customer.subscription.updated / customer.subscription.deleted
 *
 * 价格 ID → 套餐：STRIPE_PRICE_API_STARTER / STRIPE_PRICE_ACCOUNTANT_PRO / ...（见 .env.example）
 * 注意：此路由仅用标准库做验签与业务落库；
 *       需要创建 Checkout Session 时，建议加 stripe-node SDK 或直接使用 Payment Link。
 */
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import {
  upsertAccount,
  generateApiKey,
  type SubscriptionAccount,
} from "@/lib/subscription";
import { getCache } from "@/lib/cache";
import { PLANS, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function priceToPlan(priceId: string): PlanId {
  const map: Record<string, PlanId> = {
    [process.env.STRIPE_PRICE_API_STARTER ?? "\0api"]: "api-starter",
    [process.env.STRIPE_PRICE_ACCOUNTANT_PRO ?? "\0acct"]: "accountant-pro",
    [process.env.STRIPE_PRICE_CREDIT_PACK ?? "\0credit"]: "credit-pack",
    [process.env.STRIPE_PRICE_LEAD_EXPORT ?? "\0lead"]: "lead-export",
  };
  return map[priceId] ?? "free";
}

/** Stripe webhook 签名校验（t=xxx,v1=xxx 格式） */
function verifyStripeSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = header.split(",");
  let timestamp = "";
  let signature = "";
  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") signature = value;
  }
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface StripeEvent {
  type?: string;
  data?: {
    object?: {
      customer_email?: string;
      customer_details?: { email?: string };
      subscription?: string;
      id?: string;
    };
    metadata?: Record<string, string>;
  };
  metadata?: Record<string, string>;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!verifyStripeSignature(rawBody, signature)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const email =
    event.data?.object?.customer_email ??
    event.data?.object?.customer_details?.email ??
    event.data?.metadata?.email ??
    event.metadata?.email ??
    "";

  if (!email) {
    return NextResponse.json({ success: true, ignored: "no_email" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // 一次性购买：credit-pack / lead-export
        const priceId = extractPriceId(rawBody);
        const plan = priceToPlan(priceId);
        const existing = await getAccountSafe(email);
        const creditAdd =
          plan === "credit-pack" ? 10 : plan === "lead-export" ? 5_000 : 0;
        await upsertAccount(email.trim().toLowerCase(), {
          plan: existing && existing.plan !== "free" ? existing.plan : plan,
          credits: (existing?.credits ?? 0) + creditAdd,
          provider: "stripe",
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const priceId = extractPriceId(rawBody);
        const plan = priceToPlan(priceId);
        const existing = await getAccountSafe(email);
        const patch: Parameters<typeof upsertAccount>[1] = {
          plan,
          provider: "stripe",
          status: "active",
        };
        if (PLANS[plan].limits.apiCallsPerMonth > 0 && !existing?.apiKey) {
          patch.apiKey = generateApiKey();
        }
        await upsertAccount(email.trim().toLowerCase(), patch);
        break;
      }
      case "customer.subscription.deleted": {
        await upsertAccount(email.trim().toLowerCase(), { status: "cancelled" });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[billing/stripe-webhook]", event.type, err);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** 为当前版本无 stripe SDK，用宽松正则从原始 JSON 提取 price id */
function extractPriceId(raw: string): string {
  const match = raw.match(/"price"\s*:\s*\{[^}]*"id"\s*:\s*"([^"]+)"/);
  return match?.[1] ?? "";
}

async function getAccountSafe(email: string) {
  return getCache().get<SubscriptionAccount>(`acct:${email.toLowerCase()}`);
}