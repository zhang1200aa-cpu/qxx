/**
 * API 请求鉴权 + 配额强制执行（三个数据路由共用）
 *
 * 分层配额（游客优先 / 登录按需）：
 *   guest      游客 → 每 IP 限流 60 req/min（免登录）
 *   member     注册免费用户 → 每天 50 次（缓存计数）
 *   subscriber 付费用户（带 x-api-key）→ 月度配额 + 独立速率预算
 *   subscriber 付费用户（网页会话，无 key）→ 每天 1,000 次
 */
import { authenticateApiKey, consumeApiQuota, type SubscriptionAccount } from "./subscription";
import { type PlanId } from "./billing";
import { getPlan } from "./plan-config";
import { rateLimitAllow, API_IP_LIMIT } from "./rate-limit";
import { clientIp } from "./api";
import { getCache } from "./cache";
import { getCurrentUser, type UserTier } from "./auth";

export interface RequestAuth {
  account: SubscriptionAccount | null;
  planId: PlanId;
  tier: UserTier;
  highPriority: boolean;
  remaining: number | null; // 配额剩余（本次消费后）
  limit: number | null;
}

export type AuthOutcome =
  | { ok: true; auth: RequestAuth }
  | { ok: false; status: number; code: string; message: string };

/** 注册/付费用户的每日网页 API 额度（默认值，可在套餐设置中覆盖） */
export const MEMBER_DAILY_API = 50;
export const SUBSCRIBER_DAILY_WEB_API = 1_000;

/** 读取用户当前套餐的"网页会话每日 API 次数"（动态配置） */
export async function getWebDailyApiForUser(input: {
  tier: UserTier;
  planId: PlanId;
}): Promise<number> {
  if (input.tier === "guest") return 0;
  try {
    const plan = await getPlan(input.planId);
    if (plan.limits.webDailyApiCalls > 0) return plan.limits.webDailyApiCalls;
    // 回退：订阅用户用 api-starter 基准，会员用 member 基准
    const base = await getPlan(input.tier === "subscriber" ? "api-starter" : "member");
    return base.limits.webDailyApiCalls;
  } catch {
    return input.tier === "subscriber" ? SUBSCRIBER_DAILY_WEB_API : MEMBER_DAILY_API;
  }
}

/** 授权一次 API 请求 */
export async function authorizeRequest(req: Request): Promise<AuthOutcome> {
  const cache = getCache();
  const user = await getCurrentUser();
  const { account, apiKey } = await authenticateApiKey(req);

  // 提供了 key 但查无账户 → 401
  if (apiKey && !account) {
    return {
      ok: false,
      status: 401,
      code: "invalid_api_key",
      message: "Invalid API key. Check your x-api-key header.",
    };
  }

  // 有账户但已取消/过期 → 402（引导续费）
  if (account && (account.status === "cancelled" || account.status === "expired")) {
    return {
      ok: false,
      status: 402,
      code: "subscription_inactive",
      message:
        "Your subscription is inactive. Renew it at /pricing to continue API access.",
    };
  }

  // ---- 付费 API 套餐：月度配额（有 x-api-key）----
  if (account && (await getPlan(account.plan)).limits.apiCallsPerMonth > 0) {
    const quota = await consumeApiQuota(account);
    if (!quota.allowed) {
      return {
        ok: false,
        status: 429,
        code: "quota_exceeded",
        message: quota.reason ?? "Monthly quota exceeded.",
      };
    }
    return {
      ok: true,
      auth: {
        account,
        planId: account.plan,
        tier: "subscriber",
        highPriority: (await getPlan(account.plan)).limits.highPriorityApi,
        remaining: quota.remaining,
        limit: quota.limit,
      },
    };
  }

  // ---- 已登录用户（member / subscriber 网页会话）----
  if (user.tier === "member" || user.tier === "subscriber") {
    const dailyCap = await getWebDailyApiForUser(user);
    const day = new Date().toISOString().slice(0, 10);
    const key = `usage:webapi:${user.id}:${day}`;
    const used = await cache.incr!(key, 60 * 60 * 26);
    if (used > dailyCap) {
      return {
        ok: false,
        status: 429,
        code: "daily_quota_exceeded",
        message:
          user.tier === "member"
            ? "Free member daily API quota (50) reached. Upgrade to API Starter for monthly quota."
            : "Daily web API quota reached. Use your x-api-key for the full monthly quota.",
      };
    }
    return {
      ok: true,
      auth: {
        account: account ?? user.subscription,
        planId: user.planId,
        tier: user.tier,
        highPriority: user.tier === "subscriber",
        remaining: Math.max(0, dailyCap - used),
        limit: dailyCap,
      },
    };
  }

  // ---- 游客：IP 限流（免登录保底）----
  const ip = clientIp(req);
  if (!(await rateLimitAllow(`api:${ip}`, API_IP_LIMIT.max, API_IP_LIMIT.windowSeconds))) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "Too many requests from this IP. Sign in free for 50/day or upgrade for more.",
    };
  }
  return {
    ok: true,
    auth: {
      account: null,
      planId: "free",
      tier: "guest",
      highPriority: false,
      remaining: null,
      limit: null,
    },
  };
}