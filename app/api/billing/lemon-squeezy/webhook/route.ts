/**
 * POST /api/billing/lemon-squeezy/webhook
 *
 * Lemon Squeezy webhook 接入点（推荐主渠道）
 *
 * 配置：
 *   LEMONSQUEEZY_WEBHOOK_SECRET = <Lemon Squeezy Dashboard → Settings → Webhooks>
 * 在 Lemon Squeezy 后台添加 webhook URL 并勾选事件：
 *   subscription_created / subscription_updated / subscription_cancelled
 *   order_created
 *
 * 事件 → 业务动作：
 *   subscription_created / updated → 开通/切换账户套餐 + 发放 API Key
 *   subscription_cancelled          → 标记 cancelled（月内仍可用）
 *   order_created                  → 一次性购买（credit-pack/lead-export）发放点数/导出额度
 */
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getCache } from "@/lib/cache";
import {
  upsertAccount,
  generateApiKey,
  type SubscriptionAccount,
} from "@/lib/subscription";
import { PLANS, type PlanId } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lemon Squeezy 变体 ID → 我们的套餐
function planFromVariant(variantId: number): PlanId {
  const envMap = [
    "API_STARTER",
    "ACCOUNTANT_PRO",
    "CREDIT_PACK",
    "LEAD_EXPORT",
  ] as const;
  for (const key of envMap) {
    const envId = process.env[`LEMONSQUEEZY_VARIANT_${key}`];
    if (envId && Number(envId) === variantId) {
      return key.toLowerCase().replace(/_/g, "-") as PlanId;
    }
  }
  return "free";
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

interface LsEvent {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string>;
  };
  data?: {
    attributes?: {
      customer_email?: string;
      status?: string;
      variant_id?: number;
      first_order_item?: { variant_id?: number; quantity?: number };
      total?: number;
    };
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  let event: LsEvent;
  try {
    event = JSON.parse(rawBody) as LsEvent;
  } catch {
    return NextResponse.json({ success: false, error: "invalid payload" }, { status: 400 });
  }

  const eventName = event.meta?.event_name ?? "unknown";
  const email = event.data?.attributes?.customer_email?.toLowerCase() ?? "";
  if (!email) {
    // 无邮箱的事件（如 test），直接 200 避免重试
    return NextResponse.json({ success: true, ignored: "no_email" });
  }

  try {
    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const variantId = event.data?.attributes?.variant_id ?? 0;
      const plan = planFromVariant(variantId);
      const status = event.data?.attributes?.status;

      const patch: Parameters<typeof upsertAccount>[1] = {
        plan,
        provider: "lemon-squeezy",
        status: status === "cancelled" ? "cancelled" : "active",
        updatedAt: new Date().toISOString(),
      };
      if (status === "active" || status === "on_trial") {
        // 已有 key 保持复用，否则生成
        const existing = await upsertAccount(email, { plan, provider: "lemon-squeezy" });
        if (!existing.apiKey && PLANS[plan].limits.apiCallsPerMonth > 0) {
          patch.apiKey = generateApiKey();
        }
      }
      await upsertAccount(email, patch);
    } else if (eventName === "order_created") {
      // 一次性购买：credit-pack → +N credits；lead-export → 标记导出额度（简化用 credits 计数）
      const variantId = event.data?.attributes?.first_order_item?.variant_id ?? 0;
      const qty = event.data?.attributes?.first_order_item?.quantity ?? 1;
      const plan = planFromVariant(variantId);
      const existing: SubscriptionAccount | null = await getAccountSafe(email);
      const creditAdd = plan === "credit-pack" ? 10 * qty : plan === "lead-export" ? 5_000 : 0;
      await upsertAccount(email, {
        plan: existing?.plan && existing.plan !== "free" ? existing.plan : plan,
        credits: (existing?.credits ?? 0) + creditAdd,
        provider: "lemon-squeezy",
      });
    } else if (eventName === "subscription_cancelled") {
      await upsertAccount(email, { status: "cancelled" });
    } else {
      // 未识别事件，200 静默
    }
  } catch (err) {
    console.error("[billing/ls-webhook]", eventName, err);
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true, event: eventName });
}

/** 从缓存读取账户（避免额外依赖循环） */
async function getAccountSafe(email: string) {
  return getCache().get<SubscriptionAccount>(`acct:${email.toLowerCase()}`);
}